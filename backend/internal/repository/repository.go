package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"youwont.api/internal/domain"
)

func NewRepository(db *mongo.Database) *Repository {
    return &Repository{db: db}
}

type Repository struct {
	db *mongo.Database

}

func (repo *Repository) CreateUser(user domain.UserModel) error {

	usersCollection := repo.db.Collection("users")
	_, err := usersCollection.InsertOne(context.TODO(), user)
	return err
}