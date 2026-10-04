frontend_origin = ENV.fetch("FRONTEND_URL", "http://localhost:5173")
  .sub(%r{\Ahttps?://}, "")
  .delete_suffix("/")

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins frontend_origin
    resource "/api/*",
             headers: :any,
             methods: %i[get post patch delete options],
             max_age: 600
  end
end
