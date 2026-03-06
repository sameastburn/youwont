package main

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/labstack/echo/v5"
	echoSwagger "github.com/swaggo/echo-swagger"

	"youwont.api/internal/config"
	"youwont.api/internal/handler"
	"youwont.api/internal/middleware"
	"youwont.api/internal/repository"
	"youwont.api/internal/service"

	_ "youwont.api/docs"
)

// @title youwont API
// @version 1.0
// @description Social prediction betting API — create groups, place bets, resolve outcomes.

// @host localhost:8080
// @BasePath /

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Enter your Supabase JWT token with the "Bearer " prefix.

func main() {
	cfg := config.Load()

	client := connectMongo(cfg.MongoURI)
	db := client.Database(cfg.MongoDB)

	// Repositories
	userRepo := repository.NewUserRepo(db)
	groupRepo := repository.NewGroupRepo(db)
	betRepo := repository.NewBetRepo(db)
	inviteRepo := repository.NewInviteRepo(db)
	notifRepo := repository.NewNotificationRepo(db)

	// Services
	userSvc := service.NewUserService(userRepo, cfg.StartingPoints)
	groupSvc := service.NewGroupService(groupRepo, betRepo)
	betSvc := service.NewBetService(betRepo, userRepo, groupRepo, notifRepo, client, cfg.MinWager)
	inviteSvc := service.NewInviteService(inviteRepo, groupRepo, notifRepo, client)
	notifSvc := service.NewNotificationService(notifRepo)

	// Auth middleware — fetches JWKS from Supabase at startup
	auth, err := middleware.NewAuth(cfg.SupabaseJWKSURL, userSvc)
	if err != nil {
		log.Fatal("failed to init auth: ", err)
	}

	// Handlers
	userH := handler.NewUserHandler(userSvc, auth)
	groupH := handler.NewGroupHandler(groupSvc)
	betH := handler.NewBetHandler(betSvc)
	inviteH := handler.NewInviteHandler(inviteSvc)
	notifH := handler.NewNotificationHandler(notifSvc)

	// Router
	e := echo.New()

	// Public endpoint
	e.POST("/users", userH.Create)

	// Protected endpoints
	api := e.Group("", auth.Required)

	// Users
	api.GET("/users/me", userH.Me)
	api.GET("/users/search", userH.Search)

	// Groups
	api.POST("/groups", groupH.Create)
	api.GET("/groups", groupH.List)
	api.GET("/groups/:id", groupH.Get)
	api.POST("/groups/join", groupH.JoinByCode)

	// Invites
	api.POST("/groups/:id/invites", inviteH.Send)
	api.GET("/invites", inviteH.ListMine)
	api.POST("/invites/:id/accept", inviteH.Accept)
	api.POST("/invites/:id/decline", inviteH.Decline)

	// Notifications
	api.GET("/notifications", notifH.List)
	api.GET("/notifications/unread-count", notifH.UnreadCount)
	api.POST("/notifications/:id/read", notifH.MarkRead)
	api.POST("/notifications/read-all", notifH.MarkAllRead)

	// Bets
	api.GET("/groups/:id/bets", betH.ListByGroup)
	api.POST("/groups/:id/bets", betH.Create)
	api.GET("/bets/:id", betH.Get)
	api.POST("/bets/:id/wagers", betH.PlaceWager)
	api.PUT("/bets/:id/decider", betH.ChangeDecider)
	api.POST("/bets/:id/resolve", betH.Resolve)

	// Swagger docs
	e.GET("/swagger/*", echoSwagger.WrapHandler)

	log.Fatal(e.Start(":" + cfg.Port))
}

func connectMongo(uri string) *mongo.Client {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal("failed to connect to MongoDB: ", err)
	}

	if err = client.Ping(ctx, nil); err != nil {
		log.Fatal("failed to ping MongoDB: ", err)
	}

	return client
}
