"use client";
import NotificationsPage from "@/app/notifications/page";
import { useHiveUser } from "@/contexts/UserContext";
import HiveClient from "@/lib/hive/hiveclient";
import { HiveAccount } from "@/lib/models/user";
import { formatETHaddress } from "@/lib/utils";
import {
  Box,
  Button,
  Divider,
  HStack,
  Heading,
  Icon,
  Image,
  Text,
  keyframes,
  useDisclosure
} from "@chakra-ui/react";
import { useAccountModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import {
  FaBell,
  FaBook,
  FaDiscord,
  FaEthereum,
  FaHive,
  FaMapMarkerAlt,
  FaSpeakap,
  FaUser,
  FaWallet,
} from "react-icons/fa";
import { useAccount } from "wagmi";
import "../../styles/fonts.css";
import LoginModal from "../Hive/Login/LoginModal";
import CommunityTotalPayout from "../communityTotalPayout";
// import checkRewards from "./utils/checkReward";
import { claimRewards } from "./utils/claimRewards";

const blink = keyframes`
  0% { color: gold; opacity: 1; }
  50% { opacity: 0.1; }
  100% { opacity: 1; }
`;

interface Asset {
  toString(): string;
}


const SidebarDesktop = () => {
  const user = useHiveUser();
  const hiveUser = user.hiveUser;
  const ethAccount = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const [hiveAccount, setHiveAccount] = useState<HiveAccount>();
  const client = HiveClient;

  useEffect(() => {
    if (hiveUser?.name) {
      const getUserAccount = async () => {
        try {
          const userAccount = await client.database.getAccounts([hiveUser.name]);
          if (userAccount.length > 0) {
            const account = userAccount[0];

            const getBalance = (balance: string | Asset): number => {
              const balanceStr = typeof balance === 'string' ? balance : balance.toString();
              return Number(balanceStr.split(' ')[0]);
            };

            const hbdBalance = getBalance(account.reward_hbd_balance);
            const hiveBalance = getBalance(account.reward_hive_balance);
            const vestingHive = getBalance(account.reward_vesting_hive);

            const hasRewards = hbdBalance > 0 || hiveBalance > 0 || vestingHive > 0;
            // console.log(hasRewards ? "User has rewards" : "User has no rewards");
            // return hasRewards;

            setHiveAccount(userAccount[0]);
            setHasRewards(hasRewards);
          }
        } catch (error) {
          console.error("Failed to fetch user account", error);
        }
      };

      getUserAccount();
    }
  }, [hiveUser?.name]);

  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();

  const [notifications, setNotifications] = useState(false);
  const [hasRewards, setHasRewards] = useState(false);

  // useEffect(() => {
  //   const checkUserRewards = async () => {
  //     if (hiveUser) {
  //       setHasRewards(await checkRewards(String(hiveUser.name)));
  //     }
  //   };

  //   checkUserRewards();
  // }, [hiveUser]);

  const handleNotifications = () => {
    setNotifications(!notifications);
  };

  const handleClaimRewards = async () => {
    if (hiveAccount) {
      await claimRewards(hiveAccount);
      setHasRewards(false);
    }
  };

  const handleClick = () => {
    const url = "https://discord.gg/G4bamNkZuE";
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      // For mobile devices, use the Discord URL scheme to open the app
      window.location.href = url;
    } else {
      // For desktop, open in a new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };



  return (
    <>
      <LoginModal isOpen={isLoginOpen} onClose={onLoginClose} />
      <Box
        bg="Black"
        w={{ base: "full", md: 280 }}
        px={2}
        py={8}
        h="100vh"
        display="flex"
        flexDirection="column"
        color={"white"}
      >
        <Heading size="md">
          <Image
            width={"48px"}
            height={"auto"}
            src="/SKATE_HIVE_VECTOR_FIN.svg"
            alt="SkateHive"
            borderRadius={"5px"}
            _hover={{
              cursor: "pointer",
              transform: "scale(1.03)",
              border: "1px solid #A5D6A7",
              zIndex: 1,
            }}
            transition="transform 0.3s ease-out"
            minW={"100%"}
            h={"auto"}
            onClick={() => {
              window.location.href = "/";
            }}
          />
        </Heading>
        <Divider
          my={4}
          style={{ color: "#A5D6A7", borderColor: "#A5D6A7" }}
        />
        <CommunityTotalPayout />

        <HStack padding={0} mt={8} gap={3} fontSize={"22px"}>
          <FaSpeakap color="white" size={"22px"} />
          <Text fontFamily="Joystix" color={"white"} cursor={"pointer"} _hover={{ color: 'lime' }} onClick={() => {
            window.location.href = "/";
          }}>Feed</Text>
        </HStack>
        <HStack padding={0} gap={3} fontSize={"22px"}>
          <FaMapMarkerAlt color="white" size={"22px"} />
          <Text fontFamily="Joystix" color={"white"} cursor={"pointer"} _hover={{ color: 'lime' }} onClick={() => {
            window.location.href = "/map";
          }}>Map</Text>
        </HStack>
        <HStack padding={0} gap={3} fontSize={"22px"}>
          <FaBook color="white" size={"22px"} />
          <Text fontFamily="Joystix" color={"white"} cursor={"pointer"} _hover={{ color: 'lime' }} onClick={() => {
            window.location.href = "/mag";
          }}>Magazine</Text>
        </HStack>
        <HStack padding={0} gap={3} fontSize={"22px"}>
          <FaEthereum color={'white'} size={"22px"} />
          <Text fontFamily="Joystix" color={"white"} cursor={"pointer"} _hover={{ color: 'lime' }} onClick={() => {
            window.location.href = "/dao";
          }}>Dao</Text>
        </HStack>

        {!hiveUser && (
          <HStack padding={0} gap={3} fontSize={"22px"}>
            <FaDiscord size={"22px"} />
            <Text fontFamily="Joystix" color={"white"} cursor={"pointer"} _hover={{ color: 'lime' }} as="a"
              href="https://discord.gg/G4bamNkZuE"
              target="_blank"
              rel="noopener noreferrer"

            >Chat</Text>
          </HStack>
        )}


        {hiveUser ? (
          <>
            <HStack padding={0} gap={3} fontSize={"22px"}>
              <FaUser color="white" size={"22px"} />
              <Text fontFamily="Joystix" color={"white"} cursor={"pointer"} _hover={{ color: 'lime' }} onClick={() => {
                window.location.href = `/profile/${hiveUser.name}`;
              }}>Profile</Text>
            </HStack>
            <HStack padding={0} gap={3} fontSize={"22px"} _hover={{ color: 'lime' }}>
              <FaWallet color="white" size={"22px"} />
              <Text fontFamily="Joystix" color={"white"} cursor={"pointer"} _hover={{ color: 'lime' }} onClick={() => {
                window.location.href = `/wallet`;
              }}>Wallet</Text>
              {hasRewards && (
                <Button
                  gap={0}
                  leftIcon={<Icon as={FaHive} />}
                  ml={-2}
                  p={2}
                  justifyContent={"center"}
                  color="gold"
                  variant="outline"
                  border={"1px dashed black"}
                  animation={`${blink} 1s linear infinite`}
                  onClick={handleClaimRewards}
                  _hover={{
                    animation: "none",
                    border: "1px dashed yellow",
                  }}
                >
                  Rewards
                </Button>
              )}
            </HStack>


            <HStack padding={0} gap={3} fontSize={"22px"}>
              <FaDiscord size={"22px"} />
              <Text
                fontFamily="Joystix"
                color={"white"}
                cursor={"pointer"}
                _hover={{ color: 'lime' }}
                onClick={handleClick}
              >
                Chat
              </Text>
            </HStack>


            {/* <HStack
              cursor={"pointer"}
              onClick={handleNotifications}
              padding={0}
              gap={3}
              fontSize={"22px"}
            >
              <FaBell size={"22px"} />
              <Text fontFamily="Joystix" color={"white"} _hover={{ color: 'lime' }}>Notifications</Text>
            </HStack>
            {notifications ? <NotificationsPage /> : null} */}
          </>
        ) : null}
        <HStack mt="auto">
          <Button
            justifyContent={"center"}
            fontSize={"14px"}
            variant={"outline"}
            borderColor={"red.400"}
            width={"100%"}
            color={"white"}
            bg="black"
            _hover={{ bg: "red.400", color: "black" }}
            leftIcon={
              <Icon color={hiveUser ? "red.200" : "white"} as={FaHive} />
            }
            onClick={() => onLoginOpen()}
          >
            {hiveUser ? <p>{hiveUser.name}</p> : <span>Login</span>}
          </Button>
          <Button
            justifyContent={"center"}
            fontSize={"14px"}
            variant={"outline"}
            borderColor={"blue.400"}
            width={"100%"}
            bg="black"
            color={"white"}
            _hover={{ bg: "blue.400", color: "black" }}
            leftIcon={
              <Icon
                color={ethAccount.address ? "blue.400" : "white"}
                as={FaEthereum}
                marginRight={0}
              />
            }
            onClick={() =>
              !ethAccount.address && openConnectModal
                ? openConnectModal()
                : openAccountModal && openAccountModal()
            }
          >
            {ethAccount.address ? (
              formatETHaddress(ethAccount.address)
            ) : (
              <span>Connect</span>
            )}
          </Button>
        </HStack>
      </Box>
    </>
  );
};

export default SidebarDesktop;
