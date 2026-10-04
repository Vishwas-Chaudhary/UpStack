class ChatController < ApplicationController
  MAX_MESSAGE_LENGTH = 1000

  def create
    message = params[:message].to_s.strip
    if message.blank?
      return render json: { error: "Enter a message." }, status: :unprocessable_entity
    end
    if message.length > MAX_MESSAGE_LENGTH
      return render json: { error: "Messages must be #{MAX_MESSAGE_LENGTH} characters or fewer." }, status: :unprocessable_entity
    end

    data = Rails.cache.read("trending:v2") || { technologies: [], items: [] }
    answer = GeminiHelper.call(message, technologies: data[:technologies], items: data[:items])
    render json: { answer: answer }
  rescue GeminiHelper::Error => e
    render json: { error: e.message }, status: :bad_gateway
  end
end
