package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	SupabaseID string             `bson:"supabase_id"   json:"supabase_id"`
	FirstName  string             `bson:"first_name"    json:"first_name"`
	LastName   string             `bson:"last_name"     json:"last_name"`
	Username   string             `bson:"username"      json:"username"`
	AvatarURL  *string            `bson:"avatar_url"    json:"avatar_url"`
	Points     int                `bson:"points"        json:"points"`
	CreatedAt  time.Time          `bson:"created_at"    json:"created_at"`
}

func (u *User) FullName() string {
	if u.LastName == "" {
		return u.FirstName
	}
	return u.FirstName + " " + u.LastName
}
