import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './SpaceSettings.scss';

import { twemojify } from '../../../util/twemojify';

import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';
import { leave } from '../../../client/action/room';

import Text from '../../atoms/text/Text';
import IconButton from '../../atoms/button/IconButton';
import Tabs from '../../atoms/tabs/Tabs';
import { MenuHeader, MenuItem } from '../../atoms/context-menu/ContextMenu';
import PopupWindow from '../../molecules/popup-window/PopupWindow';
import RoomProfile from '../../molecules/room-profile/RoomProfile';
import RoomVisibility from '../../molecules/room-visibility/RoomVisibility';
import RoomAliases from '../../molecules/room-aliases/RoomAliases';
import RoomPermissions from '../../molecules/room-permissions/RoomPermissions';
import RoomMembers from '../../molecules/room-members/RoomMembers';
import RoomEmojis from '../../molecules/room-emojis/RoomEmojis';

import UserIC from '../../../../public/res/ic/outlined/user.svg';
import CrossIC from '../../../../public/res/ic/outlined/cross.svg';
import SettingsIC from '../../../../public/res/ic/outlined/settings.svg';
import ShieldUserIC from '../../../../public/res/ic/outlined/shield-user.svg';
import LeaveArrowIC from '../../../../public/res/ic/outlined/leave-arrow.svg';
import PinIC from '../../../../public/res/ic/outlined/pin.svg';
import PinFilledIC from '../../../../public/res/ic/filled/pin.svg';
import CategoryIC from '../../../../public/res/ic/outlined/category.svg';
import CategoryFilledIC from '../../../../public/res/ic/filled/category.svg';
import EmojiIC from '../../../../public/res/ic/outlined/emoji.svg';
import BackArrowIC from '../../../../public/res/ic/outlined/chevron-left.svg';

import { confirmDialog } from '../../molecules/confirm-dialog/ConfirmDialog';
import { useForceUpdate } from '../../hooks/useForceUpdate';

const tabText = {
  GENERAL: 'General',
  MEMBERS: 'Members',
  EMOJIS: 'Emojis',
  PERMISSIONS: 'Permissions',
};

function GeneralSettings({ roomId }) {
  const roomName = initMatrix.matrixClient.getRoom(roomId)?.name;
  const [, forceUpdate] = useForceUpdate();

  return (
    <>
      <div className="room-settings__card">
        <RoomProfile roomId={roomId} />
      </div>
      <div className="room-settings__card">
        <MenuHeader>Options</MenuHeader>
        <MenuItem
          variant="danger"
          onClick={async () => {
            const isConfirmed = await confirmDialog(
              'Leave space',
              `Are you sure that you want to leave "${roomName}" space?`,
              'Leave',
              'danger',
            );
            if (isConfirmed) leave(roomId);
          }}
          iconSrc={LeaveArrowIC}
        >
          Leave
        </MenuItem>
      </div>
      <div className="space-settings__card">
        <MenuHeader>Space visibility (who can join)</MenuHeader>
        <RoomVisibility roomId={roomId} />
      </div>
      <div className="space-settings__card">
        <MenuHeader>Space addresses</MenuHeader>
        <RoomAliases roomId={roomId} />
      </div>
    </>
  );
}

GeneralSettings.propTypes = {
  roomId: PropTypes.string.isRequired,
};

const tabItems = [
  {
    text: tabText.GENERAL,
    iconSrc: SettingsIC,
    disabled: false,
    render: (roomId) => <GeneralSettings roomId={roomId} />,
  },
  {
    text: tabText.MEMBERS,
    iconSrc: UserIC,
    disabled: false,
    render: (roomId) => <RoomMembers roomId={roomId} />,
  },
  {
    text: tabText.EMOJIS,
    iconSrc: EmojiIC,
    disabled: false,
    render: (roomId) => <RoomEmojis roomId={roomId} />,
  },
  {
    text: tabText.PERMISSIONS,
    iconSrc: ShieldUserIC,
    disabled: false,
    render: (roomId) => <RoomPermissions roomId={roomId} />,
  },
];

function useWindowToggle(setSelectedTab) {
  const [window, setWindow] = useState(null);

  useEffect(() => {
    const openSpaceSettings = (roomId, tab) => {
      setWindow({ roomId, tabText });
      const tabItem = tabItems.find((item) => item.text === tab);
      if (tabItem) setSelectedTab(tabItem);
    };
    navigation.on(cons.events.navigation.SPACE_SETTINGS_OPENED, openSpaceSettings);
    return () => {
      navigation.removeListener(cons.events.navigation.SPACE_SETTINGS_OPENED, openSpaceSettings);
    };
  }, []);

  const requestClose = () => setWindow(null);

  return [window, requestClose];
}

function SpaceSettings() {
  const [selectedTab, setSelectedTab] = useState(tabItems[0]);
  const [window, requestClose] = useWindowToggle(setSelectedTab);
  const isOpen = window !== null;
  const roomId = window?.roomId;

  const mx = initMatrix.matrixClient;
  const room = mx.getRoom(roomId);

  const handleTabChange = (tabItem) => {
    setSelectedTab(tabItem);
  };

  return (
    <PopupWindow
      isOpen={isOpen}
      className="space-settings"
      title={
        <>
          <IconButton
            src={BackArrowIC}
            className={`space-settings__back-btn${
              selectedTab === undefined ? ' space-settings__back-btn-hidden' : ''
            }`}
            tooltip="Return to list"
            onClick={() => setSelectedTab(undefined)}
          />
          <Text variant="s1" weight="medium" primary>
            {isOpen && twemojify(room.name)}
            <span style={{ color: 'var(--tc-surface-low)' }}> — space settings</span>
          </Text>
        </>
      }
      contentOptions={<IconButton src={CrossIC} onClick={requestClose} tooltip="Close" />}
      onRequestClose={requestClose}
      extraLarge
    >
      {isOpen && (
        <div className="space-settings__content">
          <Tabs
            items={tabItems}
            defaultSelected={tabItems.findIndex((tab) => tab.text === selectedTab?.text)}
            onSelect={handleTabChange}
            data={roomId}
          />
        </div>
      )}
    </PopupWindow>
  );
}

export default SpaceSettings;
