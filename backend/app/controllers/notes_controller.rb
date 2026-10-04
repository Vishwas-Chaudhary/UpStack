class NotesController < ApplicationController
  def index
    render json: current_user.notes.order(updated_at: :desc)
  end

  def create
    note = current_user.notes.new(note_params)
    if note.save
      render json: note, status: :created
    else
      render_errors(note)
    end
  end

  def update
    note = current_user.notes.find(params[:id])
    if note.update(note_params)
      render json: note
    else
      render_errors(note)
    end
  end

  def destroy
    current_user.notes.find(params[:id]).destroy
    head :no_content
  end

  private

  def note_params
    params.permit(:title, :content)
  end
end
