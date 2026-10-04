class TechnologySnapshot < ApplicationRecord
  def self.capture!(technologies)
    now = Time.current
    rows = technologies.map do |technology|
      {
        technology: technology[:name],
        category: technology[:category],
        snapshot_date: now.to_date,
        score: technology[:score],
        source_count: technology[:source_count],
        item_count: technology[:item_count],
        created_at: now,
        updated_at: now
      }
    end
    return if rows.empty?

    upsert_all(
      rows,
      unique_by: %i[technology snapshot_date],
      update_only: %i[category score source_count item_count]
    )
  end
end
