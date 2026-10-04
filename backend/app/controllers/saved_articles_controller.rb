# Every query goes through current_user, so users can only ever touch their own rows.
class SavedArticlesController < ApplicationController
  def index
    render json: current_user.saved_articles.order(created_at: :desc)
  end

  def create
    attrs = params.permit(:title, :url, :source, :description, tags: [])
    article = current_user.saved_articles.find_or_initialize_by(url: attrs[:url])
    article.assign_attributes(attrs)
    if article.save
      render json: article, status: :created
    else
      render_errors(article)
    end
  end

  def destroy
    current_user.saved_articles.find(params[:id]).destroy
    head :no_content
  end
end
