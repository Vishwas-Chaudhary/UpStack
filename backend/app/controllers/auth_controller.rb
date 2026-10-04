class AuthController < ApplicationController
  skip_before_action :authenticate!, only: %i[register login]

  def register
    user = User.new(params.permit(:name, :email, :password))
    if user.save
      render json: { token: user.api_token, user: user.public_json }, status: :created
    else
      render_errors(user)
    end
  end

  def login
    user = User.find_by(email: params[:email].to_s.strip.downcase)
    if user&.authenticate(params[:password].to_s)
      render json: { token: user.api_token, user: user.public_json }
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def logout
    current_user.regenerate_api_token # invalidates the old token
    head :no_content
  end

  def me
    render json: { user: current_user.public_json }
  end
end
