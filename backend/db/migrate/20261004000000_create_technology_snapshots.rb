class CreateTechnologySnapshots < ActiveRecord::Migration[7.2]
  def change
    create_table :technology_snapshots do |t|
      t.string :technology, null: false
      t.string :category
      t.date :snapshot_date, null: false
      t.float :score, null: false
      t.integer :source_count, null: false, default: 0
      t.integer :item_count, null: false, default: 0
      t.timestamps
    end

    add_index :technology_snapshots, %i[technology snapshot_date], unique: true
    add_index :technology_snapshots, :snapshot_date
  end
end
