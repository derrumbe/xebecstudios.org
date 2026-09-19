---
title: "Shared Signals, and Thanks for All the Fish"
date: 2024-12-13
subject: Technology
tags: [Identity, Security]
description: "TODO write a one-line description"
legacySlug: "shared-signals-and-thanks-for-all-the-fish"
# ~4 min
---

_“In fact there was only one species on the planet more intelligent than dolphins\[1\]” - Douglas Adams, Hitchhiker’s Guide to the Galaxy_

Identity security could learn a lot from dolphins—not only are they smart, but they’re playful, energetic, and creative. But one characteristic stands out above the rest: dolphins are _cooperative._

Throughout the world, there are no fewer than fifteen different dolphin species that cooperate with humans, fishing together for mutual benefit. [A recent study](https://www.pnas.org/doi/full/10.1073/pnas.2207739120) of one such species, tursiops truncatus gephyreus, describes how this relationship works:

![](/images/image)

  
The dolphins identify the school of mullet and drive them towards the fishers onshore who are waiting with nets.

![](/images/image)

Once the mullet is in range of the nets, the dolphins give a signal to the fishers—a deep, sudden dive that enables them to cast their nets at exactly the right time.

![](/images/image)

![](/images/image)

As the nets haul in their catch, the dolphins zoom in and take a few fish for themselves.

![](/images/image)

This is a mutually beneficial arrangement: the people catch more fish, and the dolphins not only get a quick meal, but they survive longer because they’re not caught up in other fishing mechanisms. It’s a win-win situation.

**How Shared Signals relates to Dolphins**

Why am I so fascinated by dolphins, you ask? Because it’s the perfect analogy for what we’re trying to do in the Shared Signals Working Group in the OpenID Foundation.

For far too long, identity has operated in isolation. Vendors often attempt to claim that they are the only provider of information and control for an organization: “Just buy our product, and we’ll solve every problem you ever have.”

In reality, though, identity is much better served by a network of informed components, sharing what they know with other pieces of the architecture in real-time. As each part of an enterprise discovers something about an identity and its context—for example, that an identity is now compromised, or that the access granted to an identity is now different because of a change to its underlying attributes, or the risk level of an identity rises dramatically because the device that the identity normally uses is no longer in compliance with organizational policy—that information can now be communicated _in a standardized way_ to all the other parts of the enterprise that might want to take action as a result.

This kind of event-based communication is just like the signal that the dolphins send to the fishers: “Hey, the fish are coming. You probably want to throw your nets.” Note that the dolphins can’t force the fishers to do anything—they receive the signal, and then decide whether or not to throw their nets. The Shared Signals Framework grants that volition to the receivers of signals—they get to choose what to (or not to) do, with their choice now informed by this new, real-time information.

We see a real future for standards that encourage cooperation and information sharing such as the Shared Signals Framework (SSF) and the various event types that use SSF as a transport layer: the Continuous Access Evaluation Protocol, Risk Incident Sharing and Coordination, and, soon, SCIM Events. _(Full disclosure, I’m a co-author on the SCIM Events standard within the IETF—a future post will describe the potential of event-based SCIM on identity architectures.)_ Mechanisms such as SSF provide a path forward for progress on ideals such as zero standing privilege—goals that cannot be realized without components coordinating and acting as a unified whole to secure identity in the enterprise.

Whether it was the dolphins or the Shared Signals that kept your interest, I do recommend you read the [scientific paper on cooperative fishing](https://www.pnas.org/doi/full/10.1073/pnas.2207739120), or at least watch the [remarkable video](https://iframe.videodelivery.net/eyJraWQiOiI3YjgzNTg3NDZlNWJmNDM0MjY5YzEwZTYwMDg0ZjViYiIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIxN2YyNGIxYzEzOGQ4ZWU2OTk4YWMxZDllZjU5MjNiMyIsImV4cCI6MTczMzQ0NTkzNSwia2lkIjoiN2I4MzU4NzQ2ZTViZjQzNDI2OWMxMGU2MDA4NGY1YmIifQ.0YpvtviVF32BnjDGriFlGS6TAk_Dvxq9LB4Kmidt8e60mOrL103DDdJwSN-J4m8mS6bi7YI525mYnG-3v62jKTRclueXyPFniO9zDYq--0Y9GBdlu6qTVbpiuZKlUSE1NQh5zLTy_Vui--RU4rmwBe5a4EpYIT1Y2P6OJEGJkbHZlOyTsVrT9CFeGz6yGdW35Lrer0NXF9_9eljDRE0xCJ1ZEsaXDQK9LlRGLAC42OtZWjVMaScXo8kb2MCVGK2jPzzjhVYwuMvrecvU4trkgt6WMK3t_gcT71ZVfbx5S6DQ-csUmuJpuxpvaiGzMtB_3FLUzbENCz4Ydbqv9MLxyA?poster=https%3A%2F%2Fvideodelivery.net%2FeyJraWQiOiI3YjgzNTg3NDZlNWJmNDM0MjY5YzEwZTYwMDg0ZjViYiIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIxN2YyNGIxYzEzOGQ4ZWU2OTk4YWMxZDllZjU5MjNiMyIsImV4cCI6MTczMzQ0NTkzNSwia2lkIjoiN2I4MzU4NzQ2ZTViZjQzNDI2OWMxMGU2MDA4NGY1YmIifQ.0YpvtviVF32BnjDGriFlGS6TAk_Dvxq9LB4Kmidt8e60mOrL103DDdJwSN-J4m8mS6bi7YI525mYnG-3v62jKTRclueXyPFniO9zDYq--0Y9GBdlu6qTVbpiuZKlUSE1NQh5zLTy_Vui--RU4rmwBe5a4EpYIT1Y2P6OJEGJkbHZlOyTsVrT9CFeGz6yGdW35Lrer0NXF9_9eljDRE0xCJ1ZEsaXDQK9LlRGLAC42OtZWjVMaScXo8kb2MCVGK2jPzzjhVYwuMvrecvU4trkgt6WMK3t_gcT71ZVfbx5S6DQ-csUmuJpuxpvaiGzMtB_3FLUzbENCz4Ydbqv9MLxyA%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D10.0s).

We have a lot to learn from these aquatic mammals: above all, dolphins are smart because they are cooperative, and they are cooperative because they are smart.

1.  _I’d be remiss if I didn’t provide the entire quote in full about dolphins: ‘It is an important and popular fact that things are not always what they seem. For instance, on the planet Earth, man had always assumed that he was more intelligent than dolphins because he had achieved so much—the wheel, New York, wars and so on—while all the dolphins had ever done was muck about in the water having a good time. But conversely, the dolphins had always believed that they were far more intelligent than man—for precisely the same reasons. Curiously enough, the dolphins had long known of the impending destruction of the planet Earth and had made many attempts to alert mankind to the danger; but most of their communications were misinterpreted as amusing attempts to punch footballs or whistle for tidbits, so they eventually gave up and left the Earth by their own means shortly before the Vogons arrived. The last ever dolphin message was misinterpreted as a surprisingly sophisticated attempt to do a double-backward somersault through a hoop while whistling the “Star-Spangled Banner,” but in fact the message was this: So long and thanks for all the fish.’  
      
    Adams, Douglas. The Ultimate Hitchhiker’s Guide to the Galaxy: Five Novels in One Outrageous Volume (p. 105). Random House Publishing Group. Kindle Edition._
