package main

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
	"github.com/unrolled/render"
)

var (
	r *render.Render
)

func init() {

	r = render.New(render.Options{
		Directory:                 "templates",
		Layout:                    "layout",
		IsDevelopment:             false,
		RequireBlocks:             true,
		DisableHTTPErrorRendering: true,
	})
}

func Index(w http.ResponseWriter, req *http.Request, _ httprouter.Params) {

	r.HTML(w, http.StatusOK, "index", nil)
}
