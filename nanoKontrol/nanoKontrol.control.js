loadAPI(1);

//This is basically going to be me copying the Generic MIDI Keyboard
//script, plus whatever other silliness I come up with.

host.defineController("WB", "nanoKontrol", "1.0", "eb96eab0-bf97-11e3-8a33-0800200c9a66");
host.defineMidiPorts(1,1);	// One in, one out
host.addDeviceNameBasedDiscoveryPair(["nanoKONTROL SLIDER/KNOB"], ["nanoKONTROL CTRL"]); //I have no idea if this works
// No host.defineSysexIdentityReply because I don't know how to find the Sysex response to pass it

//Fake enums
var NOTE = 0;
var CC = 1;

// This script will use these mappings to interpret input from the controller.
// Format is [TYPE, CHANNEL, MESSAGENUMBER]
// "Type" is one of the above enums, so "NOTE" or "CC".

// Device parameter control (the colored ones that move with the bank)
var PARAM_MESSAGES = [
[CC,9,14],
[CC,9,15],
[CC,9,16],
[CC,9,17], 
[CC,9,18],
[CC,9,19],
[CC,9,20],
[CC,9,21]
];	//nK top knobs


// Device macro control
var MACRO_MESSAGES = [
[CC,9,2], 
[CC,9,3],
[CC,9,4],
[CC,9,5], 
[CC,9,6],
[CC,9,8],
[CC,9,9],
[CC,9,12]
]; 	// nK Faders

// Device macro assignment buttons
var MAPPER_MESSAGES = [
[CC,9,23],
[CC,9,24],
[CC,9,25],
[CC,9,26],
[CC,9,27],
[CC,9,28],
[CC,9,29],
[CC,9,30]
]	//nK top row buttons


function init()
{
	host.getMidiInPort(0).setMidiCallback(onMidi);

	noteInput = host.getMidiInPort(0).createNoteInput("nanoKnobsLOL", "??????");
	noteInput.setShouldConsumeEvents(false); //So our noteInput-masked stuff gets sent to onMidi
	cursorDevice = host.createCursorDevice();	//Is this a view or an observer?
	
	for (var i = 0; i < 8; i++)
	{
		//Mark the ith parameter & macro on the selected device's current bank with pretty map colors in the GUI
		cursorDevice.getParameter(i).setIndication(true);
		cursorDevice.getMacro(i).getAmount().setIndication(true);
	}

	//userControls is populated so that all CCs are freely mappable.
	var allCCs = 128
	userControls = host.createUserControlsSection(allCCs);
}

function onMidi(status, data1, data2)
{
	println("onMidi(" + status + "," + data1 + "," + data2 +") Ch " + getMidiChannel(status));	//Debug out

	var chan = getMidiChannel(status);
	var type;
	if (isChannelController(status))
	{
		type = CC;
	}
	else if (!isChannelController(status))	// HOW DO I FIGURE OUT IF IT'S A NOTE???
	{
		type = NOTE;
	}

	var midiMessage = [type, chan, data1];

	var param_index = messageIndex(PARAM_MESSAGES, midiMessage);
	var macro_index = messageIndex(MACRO_MESSAGES, midiMessage);
	var mapper_index = messageIndex(MAPPER_MESSAGES, midiMessage);

	if(param_index != -1)	// If the message for a device parameter
	{
		//Update appropriate device parameter
		cursorDevice.getParameter(param_index).set(data2, 128);
	}
	else if (macro_index != -1)		// If the message is for a macro knob
	{
		//Update appropriate macro parameter
		cursorDevice.getMacro(macro_index).getAmount().set(data2, 128);
	}
	else if (mapper_index != -1)	// If the message is for a macro mapping button
	{
		//Toggle appropriate macro modulation source
		// TODO: fix "toggle" confusion - right now it assumes that you get one call on press and another on unpress,
		// but this isn't guaranteed to happen
		cursorDevice.getMacro(mapper_index).getModulationSource().toggleIsMapping()
	}
	else if (data1 === 47 && data2 == 127)	//nK "back"
	{
		cursorDevice.selectPrevious();
	}
	else if (data1 === 48 && data2 == 127)	//nK "forward"
	{
		cursorDevice.selectNext();
	}
	else if (data1 === 49 && data2 == 127)	//nK "loop"
	{
		cursorDevice.previousParameterPage();
	}
	else if (data1 === 44 && data2 == 127)	//nK "record"
	{
		cursorDevice.nextParameterPage();
	}
	else
	{
		//Update non-8 mapping if any
		userControls.getControl(data1).set(data2, 128);
	}
}

function exit()
{
	//Restore the controller to a certain state if needed
}

// Helper functions ----

function messageIndex(list, message)
{
	var foundIndex = -1;

	for (var i = 0; i < list.length && foundIndex === -1; i++)
	{
		if (list[i][0] === message[0]
			&& list[i][1] === message[1]
			&& list[i][2] === message[2])
		{
			foundIndex = i;
		}
	}

	return foundIndex;
}

function getMidiChannel(status)
{
	return (status & 0x0f) + 1
}