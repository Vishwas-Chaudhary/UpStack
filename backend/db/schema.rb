# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_10_04_000004) do
  create_schema "auth"
  create_schema "extensions"
  create_schema "graphql"
  create_schema "graphql_public"
  create_schema "pgbouncer"
  create_schema "realtime"
  create_schema "storage"
  create_schema "vault"

  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_stat_statements"
  enable_extension "pgcrypto"
  enable_extension "plpgsql"
  enable_extension "supabase_vault"
  enable_extension "uuid-ossp"

  create_table "comparisons", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.json "repos", default: [], null: false
    t.text "result", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_comparisons_on_user_id"
  end

  create_table "favorites", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.string "url", null: false
    t.text "description"
    t.float "metric"
    t.string "metric_label"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "source"
    t.json "tags", default: [], null: false
    t.index ["user_id", "url"], name: "index_favorites_on_user_id_and_url", unique: true
    t.index ["user_id"], name: "index_favorites_on_user_id"
  end

  create_table "notes", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title", default: "Untitled note", null: false
    t.text "content", default: "", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "updated_at"], name: "index_notes_on_user_id_and_updated_at"
    t.index ["user_id"], name: "index_notes_on_user_id"
  end

  create_table "saved_articles", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title", null: false
    t.string "url", null: false
    t.string "source"
    t.text "description"
    t.json "tags"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "url"], name: "index_saved_articles_on_user_id_and_url", unique: true
    t.index ["user_id"], name: "index_saved_articles_on_user_id"
  end

  create_table "technology_snapshots", force: :cascade do |t|
    t.string "technology", null: false
    t.string "category"
    t.date "snapshot_date", null: false
    t.float "score", null: false
    t.integer "source_count", default: 0, null: false
    t.integer "item_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["snapshot_date"], name: "index_technology_snapshots_on_snapshot_date"
    t.index ["technology", "snapshot_date"], name: "index_technology_snapshots_on_technology_and_snapshot_date", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "api_token"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["api_token"], name: "index_users_on_api_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "comparisons", "users"
  add_foreign_key "favorites", "users"
  add_foreign_key "notes", "users"
  add_foreign_key "saved_articles", "users"
end
