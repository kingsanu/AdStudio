/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ChangeEvent,
  FC,
  useMemo,
  useRef,
  useState,
  useEffect,
  useContext,
} from "react";
import DropdownButton, {
  DropdownMenuItem,
} from "canva-editor/components/dropdown-button/DropdownButton";
import { useEditor } from "canva-editor/hooks";
import { downloadObjectAsJson } from "canva-editor/utils/download";
import QuickBoxDialog from "canva-editor/components/dialog/QuickBoxDialog";
import UploadIcon from "canva-editor/icons/UploadIcon";
import DownloadIcon from "canva-editor/icons/DownloadIcon";
import AddNewPageIcon from "canva-editor/icons/AddNewPageIcon";
import ResizeIcon from "canva-editor/icons/ResizeIcon";
import LockIcon from "canva-editor/icons/LockIcon";
import LockOpenIcon from "canva-editor/icons/LockOpenIcon";
import SyncedIcon from "canva-editor/icons/SyncedIcon";
// import HelpIcon from "canva-editor/icons/HelpIcon";
import ConfigurationIcon from "canva-editor/icons/ConfigurationIcon";
import ExportIcon from "canva-editor/icons/ExportIcon";
import EditorButton from "canva-editor/components/EditorButton";
import PlayArrowIcon from "canva-editor/icons/PlayArrowIcon";
import PreviewModal from "./PreviewModal";
import FacebookIcon from "canva-editor/icons/FacebookIcon";
import InstagramIcon from "canva-editor/icons/InstagramIcon";
import { BoxSize } from "canva-editor/types";
import { dataMapping, pack, unpack } from "canva-editor/utils/minifier";
import HamburgerIcon from "canva-editor/icons/HamburgerIcon";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import SaveTemplateDialog from "canva-editor/components/editor/SaveTemplateDialog";
import SyncingIcon from "canva-editor/icons/SyncingIcon";
import { useSyncService } from "../../../hooks/useSyncService";
import { EditorContext } from "canva-editor/components/editor/EditorContext";
import { toast } from "sonner";
import { WifiOff, AlertCircle, MoreHorizontal } from "lucide-react";

interface Props {
  designName: string;
}
const HeaderFileMenu: FC<Props> = ({ designName }) => {
  const [openPreview, setOpenPreview] = useState(false);
  // const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [openSaveTemplateDialog, setOpenSaveTemplateDialog] = useState(false);
  // Keep a local copy of the design name to ensure it's up to date
  const [currentDesignName, setCurrentDesignName] = useState(designName);
  const uploadRef = useRef<HTMLInputElement>(null);
  const isMobile = useMobileDetect();
  const pageContentRef = useRef<HTMLElement | null>(null);

  // Update current design name when prop changes
  useEffect(() => {
    setCurrentDesignName(designName);
  }, [designName]); // Use the sync service
  const {
    lastSavedAt,
    isSyncing,
    hasError,
    isOffline,
    isUserTyping,
    saveNow,
    forceSyncBeforeCriticalAction,
  } = useSyncService({
    getDesignData: () => ({ pages: query.serialize() }),
    getDesignName: () => currentDesignName,
    getPageContentElement: () => pageContentRef.current,
  });
  const { actions, query, state, activePage, pageSize, isPageLocked } =
    useEditor((state) => ({
      activePage: state.activePage,
      sidebar: state.sidebar,
      pageSize: state.pageSize,
      isPageLocked:
        state.pages[state.activePage] &&
        state.pages[state.activePage].layers.ROOT.data.locked,
    }));

  // Get editor config to check type
  const { config } = useContext(EditorContext);
  const isCoupon = config.type === "coupon";

  // Resize
  const [openResizeSetting, setOpenResizeSetting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });
  const [lockSiteAspect, setLockSizeAspect] = useState(false);
  const widthRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);
  const menuData: DropdownMenuItem[] = [
    {
      label: "Create new design",
      type: "submenu",
      icon: <AddNewPageIcon />,
      items: [
        {
          label: "Custom size",
          type: "normal",
          icon: <ResizeIcon />,
          action: () => {
            setSize({
              width: 0,
              height: 0,
            });
            setIsCreating(true);
            setOpenResizeSetting(true);
          },
        },
        {
          label: "Suggested",
          type: "groupname",
        },
        {
          label: "Facebook Post (Landscape)",
          type: "normal",
          icon: <FacebookIcon />,
          hint: "940 × 788 px",
          action: () => {
            handleCloseResizeBox();
            createNew({
              width: 940,
              height: 688,
            });
          },
        },
        {
          label: "Facebook Cover",
          type: "normal",
          icon: <FacebookIcon />,
          hint: "1640 × 924 px",
          action: () => {
            handleCloseResizeBox();
            createNew({
              width: 1640,
              height: 924,
            });
          },
        },
        {
          label: "Instagram Post (Square)",
          type: "normal",
          icon: <InstagramIcon />,
          hint: "1080 × 1080 px",
          action: () => {
            handleCloseResizeBox();
            createNew({
              width: 1080,
              height: 1080,
            });
          },
        },
      ],
    },
    { label: "Divider", type: "divider" },
    {
      label: "Save",
      type: "normal",
      icon: isUserTyping ? (
        <SyncedIcon />
      ) : isSyncing ? (
        <SyncingIcon />
      ) : hasError ? (
        <AlertCircle size={18} className="text-red-500" />
      ) : isOffline ? (
        <WifiOff size={18} className="text-yellow-500" />
      ) : (
        <SyncedIcon />
      ),
      shortcut: isUserTyping
        ? "Changes being made..."
        : isSyncing
        ? "Saving..."
        : hasError
        ? "Failed to save"
        : isOffline
        ? "Offline"
        : lastSavedAt
        ? `Last saved ${lastSavedAt.toLocaleTimeString()}`
        : "All changes saved",
      action: () => {
        saveNow({ force: true }); // Force save
      },
    },
    {
      label: "Preview",
      type: "normal",
      icon: <PlayArrowIcon />,
      action: () => {
        setOpenPreview(true);
      },
    },
    {
      label: "Export",
      type: "submenu",
      icon: <ExportIcon />,
      items: [
        {
          label: `Page ${activePage + 1} as PNG`,
          type: "normal",
          action: async () => {
            const canProceed = await forceSyncBeforeCriticalAction(
              "PNG export"
            );
            if (canProceed) {
              actions.fireDownloadPNGCmd(1);
            }
          },
        },
        {
          label: "All pages as PNG",
          type: "normal",
          action: async () => {
            const canProceed = await forceSyncBeforeCriticalAction(
              "PNG export"
            );
            if (canProceed) {
              actions.fireDownloadPNGCmd(0);
            }
          },
        },
        {
          label: `All pages as PDF`,
          type: "normal",
          action: async () => {
            const canProceed = await forceSyncBeforeCriticalAction(
              "PDF export"
            );
            if (canProceed) {
              actions.fireDownloadPDFCmd(0);
            }
          },
        },
      ],
    },
    { label: "Divider", type: "divider" },
    {
      label: "View settings",
      type: "submenu",
      icon: <ConfigurationIcon />,
      disabled: isCoupon,
      action: isCoupon
        ? () => {
            toast.error("Access denied", {
              description: "Coupon size cannot be changed.",
            });
          }
        : undefined,
      items: [
        {
          label: `Resize page (${activePage + 1})`,
          type: "normal",
          icon: <ResizeIcon />,
          disabled: isPageLocked || isCoupon,
          action: () => {
            if (isCoupon) {
              toast.error("Access denied", {
                description: "Coupon size cannot be changed.",
              });
              return;
            }
            setIsCreating(false);
            setSize(pageSize);
            setOpenResizeSetting(true);
          },
        },
      ],
    },
    { label: "Divider", type: "divider" },
    {
      label: "Import design",
      type: "normal",
      icon: <UploadIcon />,
      action: () => {
        uploadRef.current?.click();
      },
    },
    {
      label: "Download design",
      type: "normal",
      icon: <DownloadIcon />,
      action: async () => {
        const canProceed = await forceSyncBeforeCriticalAction(
          "design download"
        );
        if (canProceed) {
          downloadObjectAsJson("file", pack(query.serialize(), dataMapping)[0]);
        }
      },
    },
    {
      label: "Save as Template",
      type: "normal",
      icon: <SyncedIcon />,
      action: async () => {
        const canProceed = await forceSyncBeforeCriticalAction("template save");
        if (canProceed) {
          setOpenSaveTemplateDialog(true);
        }
      },
    },
    // { label: "Divider", type: "divider" },
    // {
    //   label: "Help",
    //   type: "normal",
    //   icon: <HelpIcon />,
    //   shortcut: "⌘H",
    //   action: () => {
    //     actions.goToGithubPage();
    //   },
    // },
  ];

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function () {
        const fileContent = JSON.parse(reader.result as string);
        actions.setData(unpack(fileContent));
      };
      reader.readAsText(file);
      e.target.value = "";
    }
  };

  const isDisabledResize = useMemo(
    () => (size?.width || 0) < 100 || (size?.height || 0) < 100,
    [size]
  );

  const handleChangeSize = (value: string, type: "width" | "height") => {
    const ratio = (size?.width || 0) / (size?.height || 0);
    const v = parseInt(value, 10);
    if (type === "width") {
      if (lockSiteAspect) {
        (heightRef.current as HTMLInputElement).value = String(
          Math.round((v / ratio) * 10) / 10
        );
      }
      setSize({ ...size, width: v || 0 });
    }
    if (type === "height") {
      if (lockSiteAspect) {
        (widthRef.current as HTMLInputElement).value = String(
          Math.round(v * ratio * 10) / 10
        );
      }
      setSize({ ...size, height: v || 0 });
    }
  };

  const handleResize = () => {
    if (isDisabledResize) return;
    if (isCreating) {
      createNew(size);
    } else {
      actions.changePageSize(size);
    }
    handleCloseResizeBox();
  };

  const createNew = (boxSize: BoxSize) => {
    actions.setData([
      {
        name: "",
        notes: "",
        layers: {
          ROOT: {
            type: {
              resolvedName: "RootLayer",
            },
            props: {
              boxSize,
              position: {
                x: 0,
                y: 0,
              },
              rotate: 0,
              color: "rgb(255, 255, 255)",
              image: null,
            },
            locked: false,
            child: [],
            parent: null,
          },
        },
      },
    ]);
  };

  const handleCloseResizeBox = () => {
    setIsCreating(false);
    setSize({
      width: 0,
      height: 0,
    });
    setOpenResizeSetting(false);
  };

  // Initial setup for page content reference
  useEffect(() => {
    pageContentRef.current = document.querySelector(".page-content");
  }, []);

  return (
    <>
      <DropdownButton
        text={isMobile ? <HamburgerIcon /> : <MoreHorizontal />}
        items={menuData}
        header={
          <div css={{ padding: "16px 16px 8px" }}>
            <div css={{ fontSize: 18, fontWeight: 700, color: "#000" }}>
              {currentDesignName || "Untitled design"}
            </div>
            <div
              css={{
                fontSize: 13,
                color: "#909090",
                marginTop: 8,
                fontFamily: "Arial",
              }}
            >{`${pageSize.width}px x ${pageSize.height}px`}</div>
          </div>
        }
      />
      <input
        ref={uploadRef}
        type="file"
        accept="application/json"
        onChange={handleImport}
        css={{ display: "none" }}
      />
      <QuickBoxDialog open={openResizeSetting} onClose={handleCloseResizeBox}>
        <div css={{ padding: "0 16px 16px", width: 300 }}>
          <div css={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div>
              <div css={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Width
              </div>
              <div
                css={{
                  border: "1px solid rgba(43,59,74,.3)",
                  height: 40,
                  padding: "0 12px",
                  width: 80,
                  borderRadius: 4,
                }}
              >
                <input
                  ref={widthRef}
                  css={{ width: "100%", minWidth: 8, height: "100%" }}
                  onChange={(e) => handleChangeSize(e.target.value, "width")}
                  value={size?.width || ""}
                />
              </div>
            </div>
            <div>
              <div css={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Height
              </div>
              <div
                css={{
                  border: "1px solid rgba(43,59,74,.3)",
                  height: 40,
                  padding: "0 12px",
                  width: 80,
                  borderRadius: 4,
                }}
              >
                <input
                  ref={heightRef}
                  css={{ width: "100%", minWidth: 8, height: "100%" }}
                  onChange={(e) => handleChangeSize(e.target.value, "height")}
                  value={size?.height || ""}
                />
              </div>
            </div>
            <EditorButton
              disabled={isDisabledResize}
              onClick={() => setLockSizeAspect(!lockSiteAspect)}
              css={{ fontSize: 20, cursor: "pointer", margin: "5px 0" }}
            >
              {lockSiteAspect ? <LockIcon /> : <LockOpenIcon />}
            </EditorButton>
          </div>
          {isDisabledResize && (
            <div css={{ color: "#db1436", fontSize: 12, marginTop: 5 }}>
              Dimensions must be at least 40px and no more than 8000px.
            </div>
          )}
          <div css={{ marginTop: 12 }}>
            <button
              css={{
                background: !isDisabledResize ? "#3a3a4c" : "#8383A2",
                padding: "8px 14px",
                lineHeight: 1,
                color: "#FFF",
                borderRadius: 4,
                cursor: !isDisabledResize ? "pointer" : "not-allowed",
                fontSize: 16,
                textAlign: "center",
                fontWeight: 700,
                width: "100%",
              }}
              onClick={handleResize}
              disabled={isDisabledResize}
            >
              {isCreating ? "Create new design" : "Resize"}
            </button>
          </div>
        </div>
      </QuickBoxDialog>
      {openPreview && <PreviewModal onClose={() => setOpenPreview(false)} />}
      {openSaveTemplateDialog && (
        <SaveTemplateDialog
          open={openSaveTemplateDialog}
          onClose={() => {
            setOpenSaveTemplateDialog(false);
            // Update local design name in case it was changed in the dialog
            // Get the current name from the editor state
            if (state && state.name) {
              setCurrentDesignName(state.name);
            }
          }}
          initialName={currentDesignName}
        />
      )}
    </>
  );
};

export default HeaderFileMenu;
