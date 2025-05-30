"use client";
import UserAvatar from "@/components/UserAvatar";
import { useHiveUser } from "@/contexts/UserContext";
import { useComments } from "@/hooks/comments";
import { vote } from "@/lib/hive/client-functions";
import { commentWithPrivateKey } from "@/lib/hive/server-functions";
import { getTotalPayout } from "@/lib/utils";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Input,
  Textarea,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import * as dhive from "@hiveio/dhive";
import piexif from "piexifjs";
import { useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaImage, FaTimes } from "react-icons/fa";
import { uploadFileToIPFS } from "../upload/utils/uploadToIPFS";
import { HiveAccount } from "@/lib/useHiveAuth";

export interface Comment {
  id: number;
  author: string;
  permlink: string;
  created: string;
  body: string;
  total_payout_value?: string;
  pending_payout_value?: string;
  curator_payout_value?: string;
}

interface Coordinates {
  lat: number | null;
  lng: number | null;
}

export default function UploadForm() {
  const parent_author = "web-gnar";
  const parent_permlink = "about-the-skatehive-spotbook";

  const { comments, addComment, isLoading } = useComments(
    parent_author,
    parent_permlink
  );
  const postBodyRef = useRef<HTMLTextAreaElement>(null);
  const user = useHiveUser();
  const username = user?.hiveUser?.name;
  const [hasPosted, setHasPosted] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageList, setImageList] = useState<string[]>([]);
  const [sortMethod, setSortMethod] = useState<string>("chronological");
  const placeholderFontSize = useBreakpointValue({ base: "14px", md: "16px" });

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const convertDMSToDD = (dms: any[], ref: string): number => {
    const degrees = dms[0] || 0;
    const minutes = dms[1] || 0;
    const seconds = dms[2] || 0;
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (ref === "S" || ref === "W") {
      dd = dd * -1;
    }
    return dd;
  };

  const extractCoordinates = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const imgDataUrl = e.target?.result as string;

      if (imgDataUrl) {
        const img = new window.Image();
        img.src = imgDataUrl;

        img.onload = () => {
          const exifData = piexif.load(img.src);
          console.log("EXIF Data:", exifData);

          const gpsData = exifData.GPS || {};
          const latitude = gpsData["GPSLatitude"];
          const longitude = gpsData["GPSLongitude"];
          const latitudeRef = gpsData["GPSLatitudeRef"] || "N";
          const longitudeRef = gpsData["GPSLongitudeRef"] || "E";

          if (latitude && longitude) {
            const lat = convertDMSToDD(latitude, latitudeRef);
            const lng = convertDMSToDD(longitude, longitudeRef);

            setCoordinates({ lat, lng });
            console.log(`Latitude: ${lat}, Longitude: ${lng}`);
          }
        };
      }
    };

    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop: async (acceptedFiles) => {
      setIsUploading(true);
      const newImageList: string[] = [];
      for (const file of acceptedFiles) {
        const ipfsData = await uploadFileToIPFS(file);
        if (ipfsData !== undefined) {
          const ipfsUrl = `https://ipfs.skatehive.app/ipfs/${ipfsData.IpfsHash}`;
          const markdownLink = file.type.startsWith("video/")
            ? `<iframe src="${ipfsUrl}" allowFullScreen={true}></iframe>`
            : `![Image](${ipfsUrl})`;
          newImageList.push(markdownLink);
        }
        if (file.type.startsWith("image/")) {
          extractCoordinates(file);
        }
      }
      setImageList((prevList) => [...prevList, ...newImageList]);
      setIsUploading(false);
    },
    accept: {
      "image/*": [".png", ".gif", ".jpeg", ".jpg"],
      "video/*": [".mp4", ".mov"],
    },
    multiple: true,
  });

  const sortedComments = useMemo(() => {
    if (sortMethod === "chronological") {
      return comments?.slice().reverse();
    } else if (sortMethod === "engagement") {
      return comments?.slice().sort((a, b) => {
        return (b?.children ?? 0) - (a?.children ?? 0);
      });
    } else {
      return comments?.slice().sort((a, b) => {
        return (
          getTotalPayout(b as dhive.Discussion) -
          getTotalPayout(a as dhive.Discussion)
        );
      });
    }
  }, [comments, sortMethod]);

  const handlePostClick = () => {
    const markdownString = (
      postBodyRef.current?.value +
      "\n" +
      imageList.join("\n")
    ).trim();
    if (markdownString === "") {
      alert("Please write something before posting");
      return;
    } else if (markdownString.length > 2000) {
      alert("Post is too long. To make longform content use our /mag section");
      return;
    } else {
      handlePost(markdownString);
    }
  };

  const handlePost = async (markdownString: string) => {
    const permlink = new Date()
      .toISOString()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    const loginMethod = localStorage.getItem("LoginMethod");

    if (!username) {
      console.error("Username is missing");
      return;
    }

    const postData = {
      parent_author: parent_author,
      parent_permlink: parent_permlink,
      author: username,
      permlink: permlink,
      title: "Cast",
      body: markdownString,
      json_metadata: JSON.stringify({
        tags: ["skateboard"],
        app: "skatehive",
      }),
    };

    const operations = [["comment", postData]];

    if (loginMethod === "keychain") {
      if (typeof window !== "undefined") {
        try {
          const response = await new Promise<{
            success: boolean;
            message?: string;
          }>((resolve, reject) => {
            window.hive_keychain.requestBroadcast(
              username,
              operations,
              "posting",
              (response: any) => {
                if (response.success) {
                  resolve(response);
                } else {
                  reject(new Error(response.message));
                }
              }
            );
          });

          if (response.success) {
            if (postBodyRef.current) {
              postBodyRef.current.value = "";
            }
            addComment(postData as dhive.Discussion);
            setImageList([]);
          }
        } catch (error) {
          console.error("Error posting comment:", (error as Error).message);
        }
      }
    } else if (loginMethod === "privateKey") {
      const commentOptions: dhive.CommentOptionsOperation = [
        "comment_options",
        {
          author: String(username),
          permlink: permlink,
          max_accepted_payout: "10000.000 HBD",
          percent_hbd: 10000,
          allow_votes: true,
          allow_curation_rewards: true,
          extensions: [
            [
              0,
              {
                beneficiaries: [
                  {
                    account: "web-gnar",
                    weight: 1000,
                  },
                ],
              },
            ],
          ],
        },
      ];

      const postOperation: dhive.CommentOperation = [
        "comment",
        {
          parent_author: parent_author,
          parent_permlink: parent_permlink,
          author: String(username),
          permlink: permlink,
          title: "Cast",
          body: markdownString,
          json_metadata: JSON.stringify({
            tags: ["skateboard"],
            app: "Skatehive App",
            image: "/SKATE_HIVE_VECTOR_FIN.svg",
          }),
        },
      ];

      try {
        await commentWithPrivateKey(
          localStorage.getItem("EncPrivateKey")!,
          postOperation,
          commentOptions
        );
        if (postBodyRef.current) {
          postBodyRef.current.value = "";
        }
        addComment(postData as dhive.Discussion);
        setHasPosted(true);
        setImageList([]);
      } catch (error) {
        console.error("Error posting comment:", (error as Error).message);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageList((prevList) => prevList.filter((_, i) => i !== index));
  };

  return (
    <VStack>
      <Box
        p={4}
        width={"100%"}
        maxWidth={{ base: "100vh", md: "100vw" }}
        bg="#484848"
        color="white"
        {...getRootProps()}
        border="2px solid gray"
        _focus={{
          border: "2px solid gray",
          boxShadow: "none",
        }}
        padding={"15px"}
        overflowY="auto"
      >
        <div>
          <Flex>
            {/* @ts-ignore */}
            <UserAvatar
              hiveAccount={user.hiveUser || ({} as HiveAccount)}
              boxSize={12}
              borderRadius={5}
            />
            <Flex flexDir="column" w="100%">
              <Textarea
                border="1px solid gray"
                background={"black"}
                _focus={{
                  border: "2px solid gray",
                  boxShadow: "none",
                }}
                _placeholder={{
                  fontSize: placeholderFontSize,
                  color: "white",
                }}
                overflow={"hidden"}
                resize={"vertical"}
                ref={postBodyRef}
                placeholder="Put your text here... What is the name of the spot?... Where is the location of the spot?"
                ml={{ base: 2, md: 4 }}
                mb={{ base: 1, md: 0 }}
                width={{ base: "100%", md: "auto" }}
              />
              <HStack>
                {imageList.map((item, index) => (
                  <Box key={index} position="relative" maxW={100} maxH={100}>
                    <IconButton
                      aria-label="Remove image"
                      icon={
                        <FaTimes style={{ color: "black", strokeWidth: 1 }} />
                      }
                      size="base"
                      color="white"
                      bg="white"
                      _hover={{ bg: "white", color: "black" }}
                      _active={{ bg: "white", color: "black" }}
                      position="absolute"
                      top="0"
                      right="0"
                      onClick={() => handleRemoveImage(index)}
                      zIndex="1"
                      borderRadius="full"
                    />
                    {item.includes("![Image](") ? (
                      <Image
                        src={item.match(/!\[Image\]\((.*?)\)/)?.[1] || ""}
                        alt="markdown-image"
                        maxW="100%"
                        maxH="100%"
                        objectFit="contain"
                      />
                    ) : (
                      <video
                        src={
                          item.match(
                            /<iframe src="(.*?)" allowFullScreen={true}><\/iframe>/
                          )?.[1]
                        }
                        controls
                        muted
                        width="100%"
                      />
                    )}
                    {coordinates &&
                      coordinates.lat !== null &&
                      coordinates.lng !== null && (
                        <div>
                          <p>Latitude: {coordinates.lat}</p>
                          <p>Longitude: {coordinates.lng}</p>
                        </div>
                      )}
                  </Box>
                ))}
              </HStack>
            </Flex>
          </Flex>

          <HStack justifyContent="space-between" marginTop={2}>
            <Input
              id="md-image-upload"
              type="file"
              style={{ display: "none" }}
              {...getInputProps({ refKey: "ref" })}
              ref={inputRef}
            />
            <Button
              name="md-image-upload"
              onClick={() => inputRef.current?.click()}
              isLoading={isUploading}
              spinnerPlacement="end"
              leftIcon={<FaImage />}
              bg="purple.500"
              color="white"
              _hover={{ bg: "purple.600" }}
              _active={{ bg: "green.700" }}
            >
              Image/video
            </Button>
            <Button
              onClick={handlePostClick}
              isLoading={hasPosted}
              bg="green.500"
              color="white"
              _hover={{ bg: "green.600" }}
              _active={{ bg: "green.700" }}
            >
              {hasPosted ? "Published" : "Send It"}
            </Button>
          </HStack>
        </div>
      </Box>
    </VStack>
  );
}
