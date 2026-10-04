class ApplicationController < ActionController::API
  before_action :authenticate!

  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "Not found" }, status: :not_found
  end

  private

  attr_reader :current_user

  # Expects:  Authorization: Bearer <api_token>
  def authenticate!
    token = request.authorization.to_s.split(" ").last
    @current_user = token.present? ? User.find_by(api_token: token) : nil
    render json: { error: "Please log in" }, status: :unauthorized unless @current_user
  end

  def render_errors(record)
    render json: { error: record.errors.full_messages.to_sentence }, status: :unprocessable_entity
  end
end
