let InitModule: nkruntime.InitModule = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  initializer.registerRpc("getUserByDisplayName", getUserByDisplayName);
  initializer.registerRpc("getFriendsList", getFriendsList);
  initializer.registerRpc("getSharedBooksList", getSharedBooksList);
  logger.info("Hello World!");
};
