package main

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"youwont.api/internal/handler"
	"youwont.api/internal/repository"
	"youwont.api/internal/service"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v5"
	//"github.com/labstack/echo/v5/middleware"
)

func main() {
    godotenv.Load()

    client := connectMongo()
    db := client.Database("youwont")

    repo := repository.NewRepository(db)
    service := service.NewService(repo)
    handler := handler.NewHandler(service)

    e := echo.New()
    e.POST("/users", handler.CreateUser)

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    e.Start(":" + port)
}

func connectMongo() *mongo.Client {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		log.Fatal("MONGODB_URI environment variable is not set")
	}

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal("failed to connect to MongoDB: ", err)
	}

	if err = client.Ping(ctx, nil); err != nil {
		log.Fatal("failed to ping MongoDB: ", err)
	}

	return client
}