package main

import (
	"log"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func main() {

	router := httprouter.New()
	router.GET("/", Index)
	router.HandleMethodNotAllowed = false
	router.NotFound = http.FileServer(http.Dir("public"))
	log.Fatal(http.ListenAndServe(":8081", router))
}
