class EnableWorkspaceLibraryRls < ActiveRecord::Migration[7.2]
  TABLES = %w[repository_favorites notes].freeze

  def up
    TABLES.each { |table| execute "ALTER TABLE #{table} ENABLE ROW LEVEL SECURITY" }
  end

  def down
    TABLES.each { |table| execute "ALTER TABLE #{table} DISABLE ROW LEVEL SECURITY" }
  end
end
