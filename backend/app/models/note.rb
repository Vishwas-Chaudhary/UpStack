class Note < ApplicationRecord
  belongs_to :user

  validates :title, presence: true, length: { maximum: 160 }
  validates :content, length: { maximum: 20_000 }
end
