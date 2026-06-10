package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var collectionEn *mongo.Collection
var collectionFr *mongo.Collection

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
	ImageURL         string             `bson:"image_url" json:"image_url"`
	Topic            string             `bson:"topic" json:"topic"`
	PublishedAt      time.Time          `bson:"published_at" json:"published_at"`
}

// Search and API models
type OpenAIEmbeddingRequest struct {
	Input string `json:"input"`
	Model string `json:"model"`
}

type OpenAIEmbeddingResponse struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
	} `json:"data"`
}

type QdrantSearchRequest struct {
	Vector      []float32     `json:"vector"`
	Limit       int           `json:"limit"`
	WithPayload bool          `json:"with_payload"`
	Filter      *QdrantFilter `json:"filter,omitempty"`
}

type QdrantFilter struct {
	Must []QdrantCondition `json:"must"`
}

type QdrantCondition struct {
	Key   string `json:"key"`
	Match struct {
		Value string `json:"value"`
	} `json:"match"`
}

type QdrantSearchResponse struct {
	Result []struct {
		ID      string  `json:"id"`
		Score   float32 `json:"score"`
		Payload struct {
			ArticleID string `json:"article_id"`
		} `json:"payload"`
	} `json:"result"`
}

func getEmbedding(text string) ([]float32, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY not set")
	}

	reqBody := OpenAIEmbeddingRequest{
		Input: text,
		Model: "text-embedding-3-small",
	}
	bodyBytes, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/embeddings", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openai api error: %d", resp.StatusCode)
	}

	var res OpenAIEmbeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	if len(res.Data) == 0 {
		return nil, fmt.Errorf("no embedding returned")
	}

	return res.Data[0].Embedding, nil
}

func searchQdrant(vector []float32, lang string, limit int) ([]string, error) {
	qdrantUrl := os.Getenv("QDRANT_URL")
	if qdrantUrl == "" {
		qdrantUrl = "http://qdrant:6333"
	}

	reqBody := QdrantSearchRequest{
		Vector:      vector,
		Limit:       limit,
		WithPayload: true,
	}

	if lang != "" {
		reqBody.Filter = &QdrantFilter{
			Must: []QdrantCondition{
				{
					Key:   "language",
					Match: struct {
						Value string `json:"value"`
					}{Value: lang},
				},
			},
		}
	}

	bodyBytes, _ := json.Marshal(reqBody)
	url := fmt.Sprintf("%s/collections/articles_collection/points/search", qdrantUrl)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	apiKey := os.Getenv("QDRANT_API_KEY")
	if apiKey != "" {
		req.Header.Set("Api-Key", apiKey)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("qdrant error: %d", resp.StatusCode)
	}

	var res QdrantSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	var articleIDs []string
	for _, r := range res.Result {
		if r.Payload.ArticleID != "" {
			articleIDs = append(articleIDs, r.Payload.ArticleID)
		}
	}

	return articleIDs, nil
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

	collectionEn = client.Database("briefcast").Collection("articles_en")
	collectionFr = client.Database("briefcast").Collection("articles_fr")

	// Routes using Go 1.22 net/http
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/v1/articles", getArticles)
	mux.HandleFunc("GET /api/v1/articles/{id}", getArticleByID)
	mux.HandleFunc("GET /api/v1/topics", getTopics)

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

	lang := r.URL.Query().Get("lang")
	col := collectionEn
	if lang == "fr" {
		col = collectionFr
	}

	// Only return articles that have a summary and an image
	filter := bson.M{
		"summary":   bson.M{"$ne": nil},
		"image_url": bson.M{"$nin": []interface{}{"", nil}},
	}

	fromStr := r.URL.Query().Get("from")
	toStr := r.URL.Query().Get("to")

	if fromStr != "" || toStr != "" {
		dateFilter := bson.M{}
		if fromStr != "" {
			if t, err := time.Parse("2006-01-02", fromStr); err == nil {
				dateFilter["$gte"] = t
			}
		}
		if toStr != "" {
			if t, err := time.Parse("2006-01-02", toStr); err == nil {
				t = t.Add(24*time.Hour - time.Nanosecond)
				dateFilter["$lte"] = t
			}
		}
		if len(dateFilter) > 0 {
			filter["published_at"] = dateFilter
		}
	}

	topic := r.URL.Query().Get("topic")
	if topic != "" {
		topics := strings.Split(topic, ",")
		var filterTopics []string
		for _, t := range topics {
			t = strings.TrimSpace(t)
			filterTopics = append(filterTopics, t)
			// Match URL-encoded variation
			encoded := url.QueryEscape(t)
			if encoded != t {
				filterTopics = append(filterTopics, encoded)
				// Match lowercase hex URL-encoded variation (e.g. database uses %c3%a9 instead of %C3%A9)
				lowerEncoded := toLowerHex(encoded)
				if lowerEncoded != encoded {
					filterTopics = append(filterTopics, lowerEncoded)
				}
			}
			// Match URL-decoded variation
			decoded, err := url.QueryUnescape(t)
			if err == nil && decoded != t {
				filterTopics = append(filterTopics, decoded)
			}
		}
		if len(filterTopics) == 1 {
			filter["topic"] = filterTopics[0]
		} else {
			filter["topic"] = bson.M{"$in": filterTopics}
		}
	}

	searchQuery := r.URL.Query().Get("search")
	var sortedObjectIDs []primitive.ObjectID
	if searchQuery != "" {
		vector, err := getEmbedding(searchQuery)
		if err != nil {
			log.Printf("Error getting embedding: %v", err)
			http.Error(w, "Failed to generate search embedding", http.StatusInternalServerError)
			return
		}

		articleIDs, err := searchQdrant(vector, lang, 100) // max 100 results for search
		if err != nil {
			log.Printf("Error searching qdrant: %v", err)
			http.Error(w, "Failed to search vector database", http.StatusInternalServerError)
			return
		}

		if len(articleIDs) == 0 {
			// return empty if no matches
			json.NewEncoder(w).Encode(struct {
				Data []Article `json:"data"`
				Meta struct {
					TotalPages  int `json:"total_pages"`
					CurrentPage int `json:"current_page"`
				} `json:"meta"`
			}{Data: []Article{}, Meta: struct {
				TotalPages  int `json:"total_pages"`
				CurrentPage int `json:"current_page"`
			}{TotalPages: 1, CurrentPage: 1}})
			return
		}

		var objIDs []primitive.ObjectID
		seen := make(map[primitive.ObjectID]bool)
		for _, id := range articleIDs {
			if objID, err := primitive.ObjectIDFromHex(id); err == nil {
				if !seen[objID] {
					seen[objID] = true
					objIDs = append(objIDs, objID)
					sortedObjectIDs = append(sortedObjectIDs, objID)
				}
			}
		}
		filter["_id"] = bson.M{"$in": objIDs}
	}

	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}

	limit := 5
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	skip := int64((page - 1) * limit)
	opts := options.Find().SetSkip(skip).SetLimit(int64(limit))

	// If it's a search, we want relevance sort (which is the order of sortedObjectIDs, but we handle that in Go or let Mongo sort by default since Qdrant already filtered the top 100).
	// To keep it simple, we sort by published date unless search is active. Wait, Qdrant gave us top 100 matching the semantic query. 
	// To sort by published_at, we just add the sort option. Let's just sort by published_at so the UI stays consistent, even for search results.
	if searchQuery == "" {
		opts.SetSort(bson.D{{"published_at", -1}})
	}

	cursor, err := col.Find(context.TODO(), filter, opts)
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

	// If search is active, sort articles in memory by Qdrant relevance score (order of sortedObjectIDs)
	if searchQuery != "" && len(sortedObjectIDs) > 0 {
		articleMap := make(map[primitive.ObjectID]Article)
		for _, a := range articles {
			articleMap[a.ID] = a
		}
		var sortedArticles []Article
		for _, id := range sortedObjectIDs {
			if a, ok := articleMap[id]; ok {
				sortedArticles = append(sortedArticles, a)
			}
		}
		articles = sortedArticles
	}

	if articles == nil {
		articles = []Article{}
	}

	totalCount, err := col.CountDocuments(context.TODO(), filter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	totalPages := int((totalCount + int64(limit) - 1) / int64(limit))

	type Meta struct {
		TotalPages  int `json:"total_pages"`
		CurrentPage int `json:"current_page"`
	}
	type PaginatedResponse struct {
		Data []Article `json:"data"`
		Meta Meta      `json:"meta"`
	}

	res := PaginatedResponse{
		Data: articles,
		Meta: Meta{
			TotalPages:  totalPages,
			CurrentPage: page,
		},
	}

	json.NewEncoder(w).Encode(res)
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
	err = collectionEn.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&article)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			err = collectionFr.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&article)
			if err != nil {
				if err == mongo.ErrNoDocuments {
					http.Error(w, "Article not found", http.StatusNotFound)
					return
				}
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	json.NewEncoder(w).Encode(article)
}

func getTopics(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	lang := r.URL.Query().Get("lang")
	col := collectionEn
	if lang == "fr" {
		col = collectionFr
	}

	results, err := col.Distinct(context.TODO(), "topic", bson.M{
		"summary":   bson.M{"$ne": nil},
		"image_url": bson.M{"$nin": []interface{}{"", nil}},
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Deduplicate and normalize
	uniqueTopics := make(map[string]bool)
	var topics []string

	for _, res := range results {
		if val, ok := res.(string); ok && val != "" {
			norm := strings.TrimSpace(val)
			// URL Decode if it is encoded (e.g. %c3%a9missions -> émissions)
			if decoded, err := url.QueryUnescape(norm); err == nil {
				norm = decoded
			}
			if strings.EqualFold(norm, "vidéo") || strings.EqualFold(norm, "vid%c3%a9o") || strings.EqualFold(norm, "video") {
				norm = "video"
			}
			if !uniqueTopics[norm] {
				uniqueTopics[norm] = true
				topics = append(topics, norm)
			}
		}
	}

	if topics == nil {
		topics = []string{}
	}

	json.NewEncoder(w).Encode(topics)
}

func toLowerHex(s string) string {
	b := []byte(s)
	for i := 0; i < len(b); i++ {
		if b[i] == '%' && i+2 < len(b) {
			b[i+1] = toLowerByte(b[i+1])
			b[i+2] = toLowerByte(b[i+2])
			i += 2
		}
	}
	return string(b)
}

func toLowerByte(c byte) byte {
	if c >= 'A' && c <= 'Z' {
		return c + 32
	}
	return c
}

