class EnableTechnologySnapshotRls < ActiveRecord::Migration[7.2]
  def up
    execute "ALTER TABLE technology_snapshots ENABLE ROW LEVEL SECURITY"
  end

  def down
    execute "ALTER TABLE technology_snapshots DISABLE ROW LEVEL SECURITY"
  end
end
