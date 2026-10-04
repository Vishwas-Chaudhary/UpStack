class ComparisonsController < ApplicationController
  def index
    render json: current_user.comparisons.order(created_at: :desc)
  end

  def create
    comparison = current_user.comparisons.new(params.permit(:result, repos: []))
    if comparison.save
      render json: comparison, status: :created
    else
      render_errors(comparison)
    end
  end

  def destroy
    current_user.comparisons.find(params[:id]).destroy
    head :no_content
  end
end
