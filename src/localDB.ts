function getUserByDisplayName(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  const data = JSON.parse(payload);
  const { user_id, display_name } = data;

  if (!display_name) {
    throw new Error("Display name is required.");
  }

  const query = `SELECT * FROM users WHERE display_name LIKE $1 LIMIT 10`;
  const result = nk.sqlQuery(query, [`%${display_name}%`]);

  let friends = {} as nkruntime.FriendList;

  try {
    friends = nk.friendsList(user_id, 100);

    const friendStates: { [key: string]: string } = {};

    if (friends && friends.friends) {
      for (let i = 0; i < friends.friends.length; i++) {
        const friend = friends.friends[i];
        if (
          friend &&
          friend.user &&
          friend.user.userId &&
          friend.state !== undefined
        ) {
          friendStates[friend.user.userId] = friend.state.toString();
        } else {
          logger.warn("Invalid friend entry:", friend);
        }
      }
    }

    let items = result.filter((item: any) => item.id !== user_id);
    let queryResult = [] as any[];

    items.forEach((item) => {
      const friendState = friendStates[item.id] || "5";
      queryResult.push({
        id: item.id,
        display_name: item.display_name,
        avatar_url: item.avatar_url,
        username: item.username,
        state: friendState,
      });
    });

    return JSON.stringify({
      status: "success",
      result: queryResult,
    });
  } catch (error: any) {
    logger.error("Error getting friends list:", error);
    throw new Error("Failed to get friends list: " + error.message);
  }
}
