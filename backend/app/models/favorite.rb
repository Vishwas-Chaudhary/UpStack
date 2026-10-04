class Favorite < ApplicationRecord
  belongs_to :user

  validates :name, :url, presence: true
  validates :url, uniqueness: { scope: :user_id }
  validate :web_url

  private

  def web_url
    uri = URI.parse(url.to_s)
    return if uri.is_a?(URI::HTTP) && uri.host.present?

    errors.add(:url, "must be a valid HTTP or HTTPS URL")
  rescue URI::InvalidURIError
    errors.add(:url, "must be a valid URL")
  end
end
