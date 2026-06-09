package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Backend is healthy"))
	})

	fmt.Println("Backend server is running on port 8080...")
	http.ListenAndServe(":8080", nil)
}
