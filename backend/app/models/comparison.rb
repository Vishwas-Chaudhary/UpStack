class Comparison < ApplicationRecord
  belongs_to :user
  validates :result, presence: true
  validate :repos_count

  private

  def repos_count
    return if repos.is_a?(Array) && (2..5).cover?(repos.size)

    errors.add(:repos, "must contain 2 to 5 items")
  end
end
