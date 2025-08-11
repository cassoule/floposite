extends Node

@export var websocket_url: String = "ws://localhost:8000"
var socket := WebSocketPeer.new()

func _ready():
	if socket.connect_to_url(websocket_url) == OK:
		print("Connexion en cours...")
		await get_tree().create_timer(1.0).timeout
	else:
		push_error("Impossible de se connecter")
		set_process(false)
	
func _process(_delta):
	socket.poll()
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		while socket.get_available_packet_count() > 0:
			var pkt = socket.get_packet()
			if socket.was_string_packet():
				var text = pkt.get_string_from_utf8()
				_on_text_received(text)
	
func _on_connected(protocol):
	print("Connected to server")
	var msg = {"type": "hello", "text": "Bonjour serveur"}
	socket.get_peer(1).put_packet(JSON.parse_string(msg))
	
func _on_text_received(text: String) -> void:
	var json = JSON.new()
	var err = json.parse(text)
	if err == OK:
		var data = json.data
		print("✅ Reçu du serveur :", data)
	else:
		push_error("JSON Error: %s (line %d)".format([json.get_error_message(), json.get_error_line()]))
