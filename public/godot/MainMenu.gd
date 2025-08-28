extends Control

var roles = ["Erinyes", "Charon", "Princesse Cassandre", "Ombres"]

func _on_start_button_pressed() -> void:
	var role = roles.pick_random()
	show_role_popup(role)
	print("Le jeu commence !")

func show_role_popup(role):
	var popup = AcceptDialog.new()
	popup.dialog_text = "Votre rôle est : " + role
	add_child(popup)
	popup.popup_centered()
