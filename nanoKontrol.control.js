loadAPI(1);

//This is basically going to be me copying the Generic MIDI Keyboard
//script, plus whatever other silliness I come up with.

host.defineController("WB", "nanoKontrol", "1.0", "eb96eab0-bf97-11e3-8a33-0800200c9a66");
host.defineMidiPorts(1,1);	// One in, one out
// Register the name so Bitwig can find it on a scan,
host.addDeviceNameBasedDiscoveryPair(["nanoKONTROL SLIDER/KNOB"], ["nanoKONTROL CTRL"]); //I have no idea if this works
// No host.defineSysexIdentityReply because I don't know how to find the Sysex response to pass it

//"8 knobs" CCs
var LOW_CC = 14;
var HIGH_CC = 21;

function init()
{
	host.getMidiInPort(0).setMidiCallback(onMidi);

	noteInput = host.getMidiInPort(0).createNoteInput("nanoKnobsLOL", "??????");
	noteInput.setShouldConsumeEvents(false); //So our noteInput-masekd stuff gets sent to onMidi
	cursorDevice = host.createCursorDevice();	//Is this a view or an observer?
	
	for (var i = 0; i < 8; i++)
	{
		//Mark the ith parameter on the selected device's current bank with pretty map colors in the GUI
		cursorDevice.getParameter(i).setIndication(true);
	}

	//userControls is populated so that all CCs are freely mappable.
	var allCCs = 128
	userControls = host.createUserControlsSection(allCCs);
}

function onMidi(status, data1, data2)
{
	println("onMidi(" + status + "," + data1 + "," + data2 +")");	//Debug out

	// TODO: filter by MIDI channel. Currently this just checks CC#.
	if(isChannelController(status))
	{
		if(is8Knob(data1))
		{
			//Update appropriate 8knob parameter
			var index = data1 - LOW_CC;
			cursorDevice.getParameter(index).set(data2, 128);
			//TODO: Figure out why "set" doesn't show up in the docs		
		}
		else if (data1 === 47) //"back"
		{
			cursorDevice.selectPrevious();
		}
		else if (data1 === 48) //"forward"
		{
			cursorDevice.selectNext();
		}
		else if (!is8Knob(data1))
		{
			//Update non-8 mapping if any
			userControls.getControl(data1).set(data2, 128);
		}
	}
}

function exit()
{
	//Restore the controller to a certain state if needed
}

// Helper functions ----

function is8Knob(cc)
{
	return cc >= LOW_CC && cc <= HIGH_CC;
}