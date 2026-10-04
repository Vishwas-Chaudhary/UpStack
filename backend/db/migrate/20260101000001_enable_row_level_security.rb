# Supabase exposes every table in the "public" schema through its own REST API.
# Turning on Row Level Security (with no policies) blocks that API completely.
# Rails connects with the database owner role, which is not affected, so the app still works.
class EnableRowLevelSecurity < ActiveRecord::Migration[7.2]
  TABLES = %w[users saved_articles comparisons schema_migrations ar_internal_metadata].freeze

  def up
    TABLES.each { |t| execute "ALTER TABLE #{t} ENABLE ROW LEVEL SECURITY" }
  end

  def down
    TABLES.each { |t| execute "ALTER TABLE #{t} DISABLE ROW LEVEL SECURITY" }
  end
end
