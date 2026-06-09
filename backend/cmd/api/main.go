package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var collection *mongo.Collection

// Define Article model
type Article struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title            string             `bson:"title" json:"title"`
	URL              string             `bson:"url" json:"url"`
	Source           string             `bson:"source" json:"source"`
	Language         string             `bson:"language" json:"language"`
	Summary          string             `bson:"summary" json:"summary"`
	ReliabilityScore int                `bson:"reliability_score" json:"reliability_score"`
	AudioURL         string             `bson:"audio_url" json:"audio_url"`
}

func main() {
	// Setup MongoDB
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	clientOptions := options.Client().ApplyURI(mongoURI)
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	err = client.Ping(context.TODO(), nil)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connected to MongoDB!")

	collection = client.Database("briefcast").Collection("articles")

	// Routes using Go 1.22 net/http
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/articles", getArticles)
	mux.HandleFunc("GET /api/articles/{id}", getArticleByID)

	// Apply CORS
	handler := corsMiddleware(mux)

	fmt.Println("Backend server is running on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func getArticles(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Only return articles that have a summary
	filter := bson.M{"summary": bson.M{"$ne": nil}}
	opts := options.Find().SetSort(bson.D{{"published_at", -1}}).SetLimit(20)

	cursor, err := collection.Find(context.TODO(), filter, opts)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.TODO())

	var articles []Article
	if err = cursor.All(context.TODO(), &articles); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if articles == nil {
		articles = []Article{}
	}

	json.NewEncoder(w).Encode(articles)
}

func getArticleByID(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	idStr := r.PathValue("id")
	id, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var article Article
	err = collection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&article)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Article not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(article)
}
