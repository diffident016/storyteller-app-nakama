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

function getFriendsList(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  const data = JSON.parse(payload);
  const { user_id } = data;

  // const query = `SELECT * FROM users WHERE display_name LIKE $1 LIMIT 10`;
  // const result = nk.sqlQuery(query, [`%${display_name}%`]);

  let friends = {} as nkruntime.FriendList;

  try {
    friends = nk.friendsList(user_id, 100);

    if (friends && friends.friends) {
      const friendsWithBooks = friends.friends
        .map((friend) => {
          if (friend && friend.user && friend.user.userId) {
            const books = nk.storageList(friend.user.userId, "book_data", 100);
            const booksCounts = books.objects ? books.objects.length : 0;

            return {
              id: friend.user.userId,
              display_name: friend.user.displayName,
              avatar_url: friend.user.avatarUrl,
              username: friend.user.username,
              state: friend.state,
              book_count: booksCounts,
            };
          } else {
            logger.warn("Invalid friend entry:", friend);
            return null;
          }
        })
        .filter((friend) => friend !== null);

      return JSON.stringify({
        status: "success",
        result: friendsWithBooks,
      });
    }

    return JSON.stringify({
      status: "success",
      result: friends,
    });
  } catch (error: any) {
    logger.error("Error getting friends list:", error);
    throw new Error("Failed to get friends list: " + error.message);
  }
}

function getSharedBooksList(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  const data = JSON.parse(payload);
  const { user_id } = data;

  let friends = {} as nkruntime.FriendList;

  try {
    friends = nk.friendsList(user_id, 100);

    logger.info("Results:", friends);
    if (friends && friends.friends) {
      const sharedBooks = friends.friends
        .map((friend) => {
          if (
            friend &&
            friend.user &&
            friend.user.userId &&
            friend.state === 0
          ) {
            const results = nk.storageList(
              friend.user.userId,
              "book_data",
              100
            );

            logger.info("Results:", results);
            const books = results.objects
              ? results.objects
                  .filter((item) => item.permissionRead === 2)
                  .map((book) => book.value)
              : [];

            return books;
          } else {
            logger.warn("Invalid friend entry:", friend);
            return null;
          }
        })
        .filter((friend) => friend !== null);

      return JSON.stringify({
        status: "success",
        result: sharedBooks,
      });
    }

    return JSON.stringify({
      status: "success",
      result: [],
    });
  } catch (error: any) {
    logger.error("Error getting friends list:", error);
    throw new Error("Failed to get friends list: " + error.message);
  }
}
