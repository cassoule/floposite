extends Control

var turn = "nuit"
var roles = ["Erinyes", "Charon", "Princesse Cassandre", "Ombres"]

func _ready():
	update_players()
	await get_tree().create_timer(2).timeout
	turn = "jour"
	print("C'est le jour !")
	update_players()

func update_players():
	var texts = []
	if turn == "nuit":
		texts = ["Les yeux sont fermés...", "La voyante regarde...", "Le village dort."]
	else:
		texts = ["Tout le monde se réveille", "Discutez et votez", "Le jour commence"]
	for i in range(3):
		$VBoxContainer.get_child(i).text = texts[i]
