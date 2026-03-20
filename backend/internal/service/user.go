package service

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"youwont.api/internal/model"
)

type UserRepository interface {
	Create(ctx context.Context, user *model.User) error
	FindBySupabaseID(ctx context.Context, supabaseID string) (*model.User, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*model.User, error)
	FindByIDs(ctx context.Context, ids []primitive.ObjectID) ([]model.User, error)
	SearchByUsername(ctx context.Context, query string, limit int64) ([]model.User, error)
	AddPoints(ctx context.Context, userID primitive.ObjectID, amount int) error
	DeductPoints(ctx context.Context, userID primitive.ObjectID, amount int) error
}

type UserService struct {
	users          UserRepository
	startingPoints int
}

func NewUserService(users UserRepository, startingPoints int) *UserService {
	return &UserService{users: users, startingPoints: startingPoints}
}

// FindBySupabaseID satisfies the middleware.UserFinder interface.
func (s *UserService) FindBySupabaseID(ctx context.Context, supabaseID string) (*model.User, error) {
	return s.users.FindBySupabaseID(ctx, supabaseID)
}

func (s *UserService) Create(ctx context.Context, supabaseID, firstName, lastName, username string) (*model.User, error) {
	existing, err := s.users.FindBySupabaseID(ctx, supabaseID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, ErrAlreadyExists
	}

	user := &model.User{
		ID:         primitive.NewObjectID(),
		SupabaseID: supabaseID,
		FirstName:  firstName,
		LastName:   lastName,
		Username:   username,
		Points:     s.startingPoints,
		CreatedAt:  time.Now(),
	}

	if err := s.users.Create(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *UserService) GetByID(ctx context.Context, id primitive.ObjectID) (*model.User, error) {
	user, err := s.users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrNotFound
	}
	return user, nil
}

func (s *UserService) Search(ctx context.Context, query string) ([]model.User, error) {
	if len(query) < 1 {
		return []model.User{}, nil
	}
	return s.users.SearchByUsername(ctx, query, 20)
}
