package dto

type UserDto struct {
	ID    string `json:"id,omitempty"`
	Email string `json:"email,omitempty"`

	// Supabase Database Webhooks send the row data inside a "record" object
	Record *struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	} `json:"record,omitempty"`

	// Supabase Auth Hooks send the user data inside a "user" object
	User *struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	} `json:"user,omitempty"`
}
