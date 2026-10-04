class SavedArticle < ApplicationRecord
  belongs_to :user
  validates :title, :url, presence: true
  validates :url, uniqueness: { scope: :user_id }
end
