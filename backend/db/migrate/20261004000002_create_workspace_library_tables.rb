class CreateWorkspaceLibraryTables < ActiveRecord::Migration[7.2]
  def change
    create_table :repository_favorites do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :url, null: false
      t.text :description
      t.float :metric
      t.string :metric_label
      t.timestamps
    end
    add_index :repository_favorites, %i[user_id url], unique: true

    create_table :notes do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false, default: "Untitled note"
      t.text :content, null: false, default: ""
      t.timestamps
    end
    add_index :notes, %i[user_id updated_at]
  end
end
