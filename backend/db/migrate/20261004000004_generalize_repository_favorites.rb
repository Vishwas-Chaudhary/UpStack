class GeneralizeRepositoryFavorites < ActiveRecord::Migration[7.2]
  def up
    rename_table :repository_favorites, :favorites
    add_column :favorites, :source, :string
    add_column :favorites, :tags, :json, null: false, default: []
  end

  def down
    remove_column :favorites, :tags
    remove_column :favorites, :source
    rename_table :favorites, :repository_favorites
  end
end
