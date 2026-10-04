class User < ApplicationRecord
  has_secure_password
  has_secure_token :api_token

  has_many :saved_articles, dependent: :destroy
  has_many :comparisons, dependent: :destroy
  has_many :favorites, dependent: :destroy
  has_many :notes, dependent: :destroy

  before_validation { self.email = email.to_s.strip.downcase }

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, allow_nil: true

  def public_json
    { id: id, name: name, email: email, created_at: created_at }
  end
end
