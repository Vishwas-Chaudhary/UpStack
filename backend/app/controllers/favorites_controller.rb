class FavoritesController < ApplicationController
  def index
    render json: current_user.favorites.order(created_at: :desc)
  end

  def create
    attributes = params.permit(:name, :url, :source, :description, :metric, :metric_label, tags: [])
    favorite = current_user.favorites.find_or_initialize_by(url: attributes[:url])
    favorite.assign_attributes(attributes)
    if favorite.save
      render json: favorite, status: :created
    else
      render_errors(favorite)
    end
  end

  def destroy
    current_user.favorites.find(params[:id]).destroy
    head :no_content
  end
end
