Rails.application.routes.draw do
  scope "/api" do
    # Auth
    post   "register", to: "auth#register"
    post   "login",    to: "auth#login"
    delete "logout",   to: "auth#logout"
    get    "me",       to: "auth#me"

    # Data (all require login)
    get  "trending", to: "trending#index"
    get  "rankings", to: "rankings#index"
    get  "research", to: "research#index"
    get  "digest", to: "digest#show"
    get  "technologies/:name", to: "technologies#show"
    post "chat", to: "chat#create"
    post "compare",  to: "compare#create"
    post "compare/items", to: "compare#items"
    post "compare/ask", to: "compare#ask"

    # Per-user data
    resources :saved_articles, only: %i[index create destroy]
    resources :comparisons,    only: %i[index create destroy]
    resources :favorites, only: %i[index create destroy]
    resources :notes, only: %i[index create update destroy]
  end
end
