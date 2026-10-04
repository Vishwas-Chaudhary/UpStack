class CreateCoreTables < ActiveRecord::Migration[7.2]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :api_token
      t.timestamps
    end
    add_index :users, :email, unique: true
    add_index :users, :api_token, unique: true

    create_table :saved_articles do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.string :url, null: false
      t.string :source
      t.text :description
      t.json :tags
      t.timestamps
    end
    add_index :saved_articles, %i[user_id url], unique: true

    create_table :comparisons do |t|
      t.references :user, null: false, foreign_key: true
      t.json :repos, null: false, default: [] # 2 to 5 GitHub repo URLs
      t.text :result, null: false
      t.timestamps
    end
  end
end
