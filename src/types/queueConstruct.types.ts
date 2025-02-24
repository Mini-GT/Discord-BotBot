type Song = {
  title: string;
  url: string;
  duration: string;
  requestedBy: string;
};

export type QueueConstructType = {
  textChannel: any;
  voiceChannel: any;
  connection: any;
  songs: Song[];
  playing: boolean;
};
