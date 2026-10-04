class ResearchController < ApplicationController
  def index
    query = params[:q].to_s.strip
    return render json: { error: "Enter a search term" }, status: :unprocessable_entity if query.blank?

    render json: { query: query, results: Researcher.call(query) }
  end
end
