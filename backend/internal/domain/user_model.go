package domain

import "go.mongodb.org/mongo-driver/bson/primitive"

type UserModel struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	SupabaseID string             `bson:"supabase_id"`
	Name       string             `bson:"name,omitempty"`
	Email      string             `bson:"email,omitempty"`
}
