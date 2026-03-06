package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	MongoURI          string
	MongoDB           string
	SupabaseJWKSURL string
	StartingPoints    int
	MinWager          int
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		Port:              envOr("PORT", "8080"),
		MongoURI:          mustEnv("MONGODB_URI"),
		MongoDB:           envOr("MONGO_DB", "youwont"),
		SupabaseJWKSURL: envOr("SUPABASE_JWKS_URL", "https://pubiltfghmqmiirephsd.supabase.co/auth/v1/.well-known/jwks.json"),
		StartingPoints:    envIntOr("STARTING_POINTS", 1000),
		MinWager:          envIntOr("MIN_WAGER", 10),
	}
}

func mustEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("%s environment variable is required", key)
	}
	return val
}

func envOr(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func envIntOr(key string, fallback int) int {
	if val := os.Getenv(key); val != "" {
		n, err := strconv.Atoi(val)
		if err != nil {
			log.Fatalf("%s must be an integer", key)
		}
		return n
	}
	return fallback
}
