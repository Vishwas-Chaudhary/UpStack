class CompareController < ApplicationController
  MAX_MESSAGE_LENGTH = 1000

  def create
    repos = Array(params[:repos]).map { |r| r.to_s.strip }.reject(&:blank?).uniq
    unless (2..5).cover?(repos.size)
      return render json: { error: "Choose between 2 and 5 repositories" }, status: :unprocessable_entity
    end

    render json: { repos: repos, result: GeminiComparer.call(repos) }
  rescue GeminiComparer::Error => e
    render json: { error: e.message }, status: :bad_gateway
  end

  def items
    submitted_items = params[:items]
    unless submitted_items.is_a?(Array) && (2..5).cover?(submitted_items.size)
      return render json: { error: "Choose between 2 and 5 dashboard items" }, status: :unprocessable_entity
    end

    unless submitted_items.all? { |item| item.is_a?(ActionController::Parameters) }
      return render json: { error: "Each selected item must include dashboard item details" }, status: :unprocessable_entity
    end

    items = submitted_items.map do |item|
      item.permit(:title, :url, :source, :description, :metric, :metric_label, tags: []).to_h.symbolize_keys
    end
    labels = items.map { |item| "#{item[:title]} (#{item[:source]})" }

    render json: { repos: labels, result: GeminiItemComparer.call(items) }
  rescue GeminiComparer::Error => e
    render json: { error: e.message }, status: :bad_gateway
  end

  def ask
    message = params[:message].to_s.strip
    if message.blank?
      return render json: { error: "Enter a question about this comparison." }, status: :unprocessable_entity
    end
    if message.length > MAX_MESSAGE_LENGTH
      return render json: { error: "Messages must be #{MAX_MESSAGE_LENGTH} characters or fewer." }, status: :unprocessable_entity
    end

    repos = params[:repos]
    result = params[:result].to_s
    history = params[:history]
    unless repos.is_a?(Array) && repos.size.between?(2, 5) && repos.all? { |repo| repo.is_a?(String) && repo.present? }
      return render json: { error: "A valid comparison is required to ask follow-up questions." }, status: :unprocessable_entity
    end
    if result.blank? || result.length > 20_000
      return render json: { error: "The comparison result is missing or too large to use as chat context." }, status: :unprocessable_entity
    end
    unless history.is_a?(Array) && history.size <= 10 && history.all? { |entry| entry.is_a?(ActionController::Parameters) }
      return render json: { error: "Chat history is invalid. Start a new question and try again." }, status: :unprocessable_entity
    end

    conversation = history.map do |entry|
      item = entry.permit(:role, :text)
      role = item[:role].to_s
      text = item[:text].to_s.strip
      unless %w[user assistant].include?(role) && text.present? && text.length <= MAX_MESSAGE_LENGTH
        return render json: { error: "Chat history contains an invalid message." }, status: :unprocessable_entity
      end

      { role: role, text: text }
    end

    answer = GeminiComparisonChat.call(
      message,
      repos: repos.map { |repo| repo.truncate(300) },
      result: result,
      history: conversation
    )
    render json: { answer: answer }
  rescue GeminiComparer::Error => e
    render json: { error: e.message }, status: :bad_gateway
  end
end
