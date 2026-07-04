import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';

export interface SocialUser {
  id: string;
  name: string;
  username: string;
  role: string;
  img: string;
  bio: string;
  location: string;
  joinedAt?: number;
}

// Simulated persistence
const STORAGE_KEYS = {
  REGISTRY: 'curator_user_registry',
  FOLLOWING: 'curator_following_map', // stores who EACH user follows
  FOLLOWERS: 'curator_followers_map', // stores who follows EACH user
  NEW_FOLLOWERS: 'curator_new_followers_map'
};

export function useSocial() {
  const { user } = useAuth();
  const [registry, setRegistry] = useState<SocialUser[]>([]);
  const [following, setFollowing] = useState<string[]>([]); // Current user's following list (usernames)
  const [followers, setFollowers] = useState<string[]>([]); // Current user's followers list (usernames)
  const [newFollowers, setNewFollowers] = useState<string[]>([]); // Subset of followers

  // Register current user in the global registry
  useEffect(() => {
    if (user && user.username) {
      const savedRegistry = localStorage.getItem(STORAGE_KEYS.REGISTRY);
      const currentRegistry: SocialUser[] = savedRegistry ? JSON.parse(savedRegistry) : [];
      
      const exists = currentRegistry.find(u => u.username === user.username);
      if (!exists) {
        const newUser: SocialUser = {
          id: user.username,
          username: user.username,
          name: user.fullName || user.username,
          role: user.expertise?.[0] || 'Member',
          img: user.profileImage,
          bio: user.bio,
          location: user.location,
          joinedAt: Date.now()
        };
        const updated = [...currentRegistry, newUser];
        localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify(updated));
        setRegistry(updated);
      } else {
        // Update details if they changed
        const updated = currentRegistry.map(u => 
          u.username === user.username 
            ? { ...u, name: user.fullName || user.username, role: user.expertise?.[0] || 'Member', img: user.profileImage, bio: user.bio, location: user.location }
            : u
        );
        localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify(updated));
        setRegistry(updated);
      }
    } else {
        const savedRegistry = localStorage.getItem(STORAGE_KEYS.REGISTRY);
        if (savedRegistry) setRegistry(JSON.parse(savedRegistry));
    }
  }, [user]);

  // Load relationships and requests
  const [incomingRequests, setIncomingRequests] = useState<string[]>([]);
  const [pendingRequestsSent, setPendingRequestsSent] = useState<string[]>([]);

  const checkRequireFollowApproval = (targetUsername: string): boolean => {
    try {
      const savedUserSettingsByUsername = JSON.parse(localStorage.getItem('curator_user_settings_by_username') || '{}');
      const targetSettings = savedUserSettingsByUsername[targetUsername];
      if (targetSettings && typeof targetSettings.requireFollowApproval === 'boolean') {
        return targetSettings.requireFollowApproval;
      }
    } catch (e) {
      console.error(e);
    }
    // Hardcoded defaults for demonstration/testing
    if (targetUsername === 'dr._sarah_chen' || targetUsername === 'alex_rivera') {
      return true;
    }
    return false;
  };

  const loadRelationshipsAndRequests = () => {
    if (user?.username) {
      const followingMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWING) || '{}');
      const followersMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWERS) || '{}');
      const newFollowersMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.NEW_FOLLOWERS) || '{}');
      const requestsMap = JSON.parse(localStorage.getItem('curator_follow_requests_map') || '{}');

      setFollowing(followingMap[user.username] || []);
      setFollowers(followersMap[user.username] || []);
      setNewFollowers(newFollowersMap[user.username] || []);

      // Load incoming follow requests (who wants to follow current user)
      setIncomingRequests(requestsMap[user.username] || []);

      // Load pending requests sent (who current user has requested to follow)
      const requested: string[] = [];
      Object.entries(requestsMap).forEach(([target, requestees]: [string, any]) => {
        if (Array.isArray(requestees) && requestees.includes(user.username)) {
          requested.push(target);
        }
      });
      setPendingRequestsSent(requested);
    }
  };

  useEffect(() => {
    loadRelationshipsAndRequests();
  }, [user?.username]);

  const toggleFollow = (targetUsername: string) => {
    if (!user?.username) return;

    const followingMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWING) || '{}');
    const followersMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWERS) || '{}');
    const requestsMap = JSON.parse(localStorage.getItem('curator_follow_requests_map') || '{}');

    const currentUserFollowing = followingMap[user.username] || [];
    const targetUserFollowers = followersMap[targetUsername] || [];
    const targetUserRequests = requestsMap[targetUsername] || [];

    let updatedFollowing = [...currentUserFollowing];
    let updatedTargetFollowers = [...targetUserFollowers];
    let updatedTargetRequests = [...targetUserRequests];

    const isFollowing = currentUserFollowing.includes(targetUsername);
    const isPending = targetUserRequests.includes(user.username);

    if (isFollowing) {
      // Unfollow
      updatedFollowing = currentUserFollowing.filter((u: string) => u !== targetUsername);
      updatedTargetFollowers = targetUserFollowers.filter((u: string) => u !== user.username);
      
      followingMap[user.username] = updatedFollowing;
      followersMap[targetUsername] = updatedTargetFollowers;
      localStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(followingMap));
      localStorage.setItem(STORAGE_KEYS.FOLLOWERS, JSON.stringify(followersMap));
      setFollowing(updatedFollowing);
    } else if (isPending) {
      // Cancel request
      updatedTargetRequests = targetUserRequests.filter((u: string) => u !== user.username);
      requestsMap[targetUsername] = updatedTargetRequests;
      localStorage.setItem('curator_follow_requests_map', JSON.stringify(requestsMap));
      setPendingRequestsSent(prev => prev.filter(u => u !== targetUsername));
    } else {
      // Follow request or Direct follow
      const requiresApproval = checkRequireFollowApproval(targetUsername);
      if (requiresApproval) {
        // Send Follow Request
        if (!targetUserRequests.includes(user.username)) {
          updatedTargetRequests = [user.username, ...targetUserRequests];
          requestsMap[targetUsername] = updatedTargetRequests;
          localStorage.setItem('curator_follow_requests_map', JSON.stringify(requestsMap));
          setPendingRequestsSent(prev => [targetUsername, ...prev]);
        }
      } else {
        // Direct Follow
        updatedFollowing = [targetUsername, ...currentUserFollowing];
        updatedTargetFollowers = [user.username, ...targetUserFollowers];
        
        const newFollowersMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.NEW_FOLLOWERS) || '{}');
        const targetNewFollowers = newFollowersMap[targetUsername] || [];
        if (!targetNewFollowers.includes(user.username)) {
          newFollowersMap[targetUsername] = [...targetNewFollowers, user.username];
          localStorage.setItem(STORAGE_KEYS.NEW_FOLLOWERS, JSON.stringify(newFollowersMap));
        }

        followingMap[user.username] = updatedFollowing;
        followersMap[targetUsername] = updatedTargetFollowers;
        
        localStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(followingMap));
        localStorage.setItem(STORAGE_KEYS.FOLLOWERS, JSON.stringify(followersMap));
        setFollowing(updatedFollowing);
      }
    }
  };

  const acceptFollowRequest = (senderUsername: string) => {
    if (!user?.username) return;

    const requestsMap = JSON.parse(localStorage.getItem('curator_follow_requests_map') || '{}');
    const followersMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWERS) || '{}');
    const followingMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWING) || '{}');

    const myRequests = requestsMap[user.username] || [];
    const myFollowers = followersMap[user.username] || [];
    const senderFollowing = followingMap[senderUsername] || [];

    // Remove from request queue
    const updatedRequests = myRequests.filter((u: string) => u !== senderUsername);
    requestsMap[user.username] = updatedRequests;

    // Add to followers and following maps
    const updatedFollowers = [senderUsername, ...myFollowers];
    const updatedSenderFollowing = [user.username, ...senderFollowing];

    followersMap[user.username] = updatedFollowers;
    followingMap[senderUsername] = updatedSenderFollowing;

    // Set new follower notification for current user
    const newFollowersMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.NEW_FOLLOWERS) || '{}');
    const targetNewFollowers = newFollowersMap[user.username] || [];
    if (!targetNewFollowers.includes(senderUsername)) {
      newFollowersMap[user.username] = [senderUsername, ...targetNewFollowers];
      localStorage.setItem(STORAGE_KEYS.NEW_FOLLOWERS, JSON.stringify(newFollowersMap));
    }

    localStorage.setItem('curator_follow_requests_map', JSON.stringify(requestsMap));
    localStorage.setItem(STORAGE_KEYS.FOLLOWERS, JSON.stringify(followersMap));
    localStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(followingMap));

    setIncomingRequests(updatedRequests);
    setFollowers(updatedFollowers);
  };

  const declineFollowRequest = (senderUsername: string) => {
    if (!user?.username) return;

    const requestsMap = JSON.parse(localStorage.getItem('curator_follow_requests_map') || '{}');
    const myRequests = requestsMap[user.username] || [];

    const updatedRequests = myRequests.filter((u: string) => u !== senderUsername);
    requestsMap[user.username] = updatedRequests;

    localStorage.setItem('curator_follow_requests_map', JSON.stringify(requestsMap));
    setIncomingRequests(updatedRequests);
  };

  const removeFollower = (followerUsername: string) => {
    if (!user?.username) return;

    const followersMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWERS) || '{}');
    const followingMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWING) || '{}');

    const myFollowers = followersMap[user.username] || [];
    const senderFollowing = followingMap[followerUsername] || [];

    const updatedFollowers = myFollowers.filter((u: string) => u !== followerUsername);
    const updatedSenderFollowing = senderFollowing.filter((u: string) => u !== user.username);

    followersMap[user.username] = updatedFollowers;
    followingMap[followerUsername] = updatedSenderFollowing;

    localStorage.setItem(STORAGE_KEYS.FOLLOWERS, JSON.stringify(followersMap));
    localStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(followingMap));

    setFollowers(updatedFollowers);
  };

  const getMutualFollows = (otherUsername: string) => {
    if (!user?.username) return [];
    const followingMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOWING) || '{}');
    const myFollowing = followingMap[user.username] || [];
    const theirFollowing = followingMap[otherUsername] || [];
    
    return myFollowing.filter((u: string) => theirFollowing.includes(u));
  };

  const clearNewFollowers = () => {
    if (!user?.username) return;
    const newFollowersMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.NEW_FOLLOWERS) || '{}');
    newFollowersMap[user.username] = [];
    localStorage.setItem(STORAGE_KEYS.NEW_FOLLOWERS, JSON.stringify(newFollowersMap));
    setNewFollowers([]);
  };

  return {
    registry,
    following,
    followers,
    newFollowers,
    incomingRequests,
    pendingRequestsSent,
    toggleFollow,
    clearNewFollowers,
    getMutualFollows,
    acceptFollowRequest,
    declineFollowRequest,
    removeFollower,
    checkRequireFollowApproval
  };
}
