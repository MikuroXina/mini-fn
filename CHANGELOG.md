# Changelog

## [5.2.0](https://github.com/MikuroXina/mini-fn/compare/v5.1.0...v5.2.0) (2023-11-01)


### Features

* Add unwrap and unwrapErr for Result ([#132](https://github.com/MikuroXina/mini-fn/issues/132)) ([f76d550](https://github.com/MikuroXina/mini-fn/commit/f76d550920c6e4e27fa0f27dba201c46e83ef651))

## [5.1.0](https://github.com/MikuroXina/mini-fn/compare/v5.0.0...v5.1.0) (2023-09-29)


### Features

* Add Traversal and Bitraversal optical ([#118](https://github.com/MikuroXina/mini-fn/issues/118)) ([9c9558c](https://github.com/MikuroXina/mini-fn/commit/9c9558cbbdb9a1f9fb74c814867deec6edfffae6))

## [5.0.0](https://github.com/MikuroXina/mini-fn/compare/v5.0.0...v5.0.0) (2023-09-21)


### ⚠ BREAKING CHANGES

* Improve Optical to be simpler ([#104](https://github.com/MikuroXina/mini-fn/issues/104))
* Remake Lens as Optical ([#95](https://github.com/MikuroXina/mini-fn/issues/95))
* Enforce Lens ([#69](https://github.com/MikuroXina/mini-fn/issues/69))
* Add more docs and Fix incomplete typings ([#56](https://github.com/MikuroXina/mini-fn/issues/56))
* Add Adjunction and Remove Semigroupal from Apply ([#49](https://github.com/MikuroXina/mini-fn/issues/49))
* Add natural transformations and profunctors ([#48](https://github.com/MikuroXina/mini-fn/issues/48))
* New higher kinded types system ([#46](https://github.com/MikuroXina/mini-fn/issues/46))
* Remove oneShot and Enforce test for func ([#40](https://github.com/MikuroXina/mini-fn/issues/40))
* Tidy up about Ord and Eq ([#34](https://github.com/MikuroXina/mini-fn/issues/34))
* Make types readonly ([#24](https://github.com/MikuroXina/mini-fn/issues/24))
* Improve to be tree-shakable ([#14](https://github.com/MikuroXina/mini-fn/issues/14))
* Improve Free implementation ([#8](https://github.com/MikuroXina/mini-fn/issues/8))

### Features

* Add Adjunction and Remove Semigroupal from Apply ([#49](https://github.com/MikuroXina/mini-fn/issues/49)) ([368ed8f](https://github.com/MikuroXina/mini-fn/commit/368ed8f213bc3cddd86fde89ff97ce77532b7adb))
* Add adjunction for Free ([#51](https://github.com/MikuroXina/mini-fn/issues/51)) ([a8be37d](https://github.com/MikuroXina/mini-fn/commit/a8be37d3c0bdeb16141a064889bc3bf96f7b4a39))
* Add boolean monoid ([85cf720](https://github.com/MikuroXina/mini-fn/commit/85cf72065cb9a82008b28b81040a58d4819a73b4))
* Add cartesianProduct and related stuffs ([#27](https://github.com/MikuroXina/mini-fn/issues/27)) ([82dd09d](https://github.com/MikuroXina/mini-fn/commit/82dd09d51eaac154f8d223cc86436b3318bbcb8a))
* Add Cat ([c178a10](https://github.com/MikuroXina/mini-fn/commit/c178a1052c46a2c32453491d3ebd742c9f001f1d))
* Add CatT, monad chaining gadget ([#74](https://github.com/MikuroXina/mini-fn/issues/74)) ([2335008](https://github.com/MikuroXina/mini-fn/commit/2335008c06d699b2a63ac5b9f891e7773188cc70))
* Add Comonad, Zipper, Store ([#23](https://github.com/MikuroXina/mini-fn/issues/23)) ([7e70132](https://github.com/MikuroXina/mini-fn/commit/7e701327d7800e1f3baf6859370ec3abbd76c312))
* Add ComonadStore ([#57](https://github.com/MikuroXina/mini-fn/issues/57)) ([a6ba201](https://github.com/MikuroXina/mini-fn/commit/a6ba20108f35619e4333076c7dd6b57112a86bf1))
* Add Cont monad ([6a92dfc](https://github.com/MikuroXina/mini-fn/commit/6a92dfcf88e59560a5a32d81aa4f61ed1902ff5d))
* Add contains ([db692ca](https://github.com/MikuroXina/mini-fn/commit/db692caf158845dcbf6fdd3b8fd06b1ee6016618))
* Add Contravariant ([5c25aab](https://github.com/MikuroXina/mini-fn/commit/5c25aabcf47329743956c09e07aa98057d168f9a))
* Add curry ([2216b49](https://github.com/MikuroXina/mini-fn/commit/2216b499645e985fe9f6cc716d6b12aa81667332))
* Add debug, dirxml and table ([9b5ee45](https://github.com/MikuroXina/mini-fn/commit/9b5ee45b8115ec66030847788f5f935213aca8c8))
* Add Endo ([3571d83](https://github.com/MikuroXina/mini-fn/commit/3571d83370ef9c0592a22ff0c6772f154770e473))
* Add Foldable ([1acae6e](https://github.com/MikuroXina/mini-fn/commit/1acae6efbed9e470392d03dca80ae20494c825ff))
* Add Free monad ([9c8fc8b](https://github.com/MikuroXina/mini-fn/commit/9c8fc8bac8b6e312c86737d8a1dca84383559201))
* Add func ([6d4ab72](https://github.com/MikuroXina/mini-fn/commit/6d4ab72c866e2b9152066f49c8af2c8b33b8f836))
* Add Functor ([45c12de](https://github.com/MikuroXina/mini-fn/commit/45c12de9b90c4f3bc81b125a8366a9e4aa9c6db2))
* Add Group and something ([#63](https://github.com/MikuroXina/mini-fn/issues/63)) ([6ca2b70](https://github.com/MikuroXina/mini-fn/commit/6ca2b70ba8114460ce5857cee9363c0f453f0ef2))
* Add Identity ([ce0a2a7](https://github.com/MikuroXina/mini-fn/commit/ce0a2a7190633e895d17522ab40632da7dc0582e))
* Add lib ([8b326a8](https://github.com/MikuroXina/mini-fn/commit/8b326a844eb431ab4d7c975921acbf39437cd681))
* Add List monad ([2bdd61a](https://github.com/MikuroXina/mini-fn/commit/2bdd61adb529699fd522dd5bcb0e0705dacecc58))
* Add local ([c67f0e4](https://github.com/MikuroXina/mini-fn/commit/c67f0e4156d5e9926053fa80f77765260fae878b))
* Add makeMonoid ([6a783cb](https://github.com/MikuroXina/mini-fn/commit/6a783cbadc58d6a96bb48086a0b975059ef7838a))
* Add monad ([21ea1e2](https://github.com/MikuroXina/mini-fn/commit/21ea1e26982a739119bbe75b50248968717f3792))
* Add monoid ([8e94831](https://github.com/MikuroXina/mini-fn/commit/8e94831db66e36f4d24b827c544e27a76833f80b))
* Add monoid and monad for Promise ([e1cde54](https://github.com/MikuroXina/mini-fn/commit/e1cde5483b26c78f11a8ce2d7ef2d213570441e1))
* Add monoidal categories ([#52](https://github.com/MikuroXina/mini-fn/issues/52)) ([5f927fb](https://github.com/MikuroXina/mini-fn/commit/5f927fb64942cee390f6590863262cbb95e6908a))
* Add natural transformations and profunctors ([#48](https://github.com/MikuroXina/mini-fn/issues/48)) ([cfc1652](https://github.com/MikuroXina/mini-fn/commit/cfc1652339bbe26553cfae6bb24a4c4c6299bd08))
* Add okOr and okOrElse ([2d3531a](https://github.com/MikuroXina/mini-fn/commit/2d3531aba65bf9816c698b9c6722cd9f1bd36364))
* Add PartialEq and Eq ([4cab899](https://github.com/MikuroXina/mini-fn/commit/4cab899c64d06271321970db9ff0d3f91ea0d220))
* Add partialEq and eq for Option and List ([#20](https://github.com/MikuroXina/mini-fn/issues/20)) ([e823418](https://github.com/MikuroXina/mini-fn/commit/e823418ba9b8a009073e5ad16e568d7bd1cd3400))
* Add PartialOrd, Ord and Option ([57f6a1e](https://github.com/MikuroXina/mini-fn/commit/57f6a1e053c923384fc2e8db60d09b34bc6fbfca))
* Add Profunctor and Strong ([7d1abae](https://github.com/MikuroXina/mini-fn/commit/7d1abae3f1829959ff972faf6f8a2d54a0ccb4f6))
* Add Reader monad ([42bd1ab](https://github.com/MikuroXina/mini-fn/commit/42bd1abeb3a03d787b0021930260451266f086ea))
* Add Result and Integrate with Option ([08f0e0f](https://github.com/MikuroXina/mini-fn/commit/08f0e0f36e8faf78938001c0c0a0dd6320f942c2))
* Add Reverse ([#66](https://github.com/MikuroXina/mini-fn/issues/66)) ([74b68b9](https://github.com/MikuroXina/mini-fn/commit/74b68b92f04504efa9509a12e00896dbfd85a8bf))
* Add SemiGroupoid and Category ([966feee](https://github.com/MikuroXina/mini-fn/commit/966feee5e15410c8c361404ab1e4732d8e45debf))
* Add Seq and FingerTree ([#50](https://github.com/MikuroXina/mini-fn/issues/50)) ([2908578](https://github.com/MikuroXina/mini-fn/commit/29085786e2ce44029d6c98d39e2436cd95826b6e))
* Add some partial-applied and Enforce test ([#37](https://github.com/MikuroXina/mini-fn/issues/37)) ([c76c35e](https://github.com/MikuroXina/mini-fn/commit/c76c35ec832b1cbe88f2eed886b13665c20df26a))
* Add State monad ([48baf79](https://github.com/MikuroXina/mini-fn/commit/48baf793dc1071b6cc640fa758508cd8629cc54c))
* Add test and features and Fix bugs for List ([#19](https://github.com/MikuroXina/mini-fn/issues/19)) ([292555f](https://github.com/MikuroXina/mini-fn/commit/292555fe313efd334b6f2803e078e5d4a25af484))
* Add then for CatT ([#106](https://github.com/MikuroXina/mini-fn/issues/106)) ([9d2fb36](https://github.com/MikuroXina/mini-fn/commit/9d2fb3601b73f36d8c8a2d4ef20f1dc80294edd6))
* Add Traversable ([5b2f540](https://github.com/MikuroXina/mini-fn/commit/5b2f5406816dd3207e53878790d2a01c0783ee69))
* Add tuple ([515aaed](https://github.com/MikuroXina/mini-fn/commit/515aaede682223fb1323b90342796ddbb8e09352))
* Add variance annotations ([24b32df](https://github.com/MikuroXina/mini-fn/commit/24b32dfda5f96df4399da25fec263ac59648d312))
* Add Writer monad ([cb35d66](https://github.com/MikuroXina/mini-fn/commit/cb35d6651e97594aaf37fc7caeb5ddf5e6a1e5c2))
* Enforce Apply ([1a0fd11](https://github.com/MikuroXina/mini-fn/commit/1a0fd11202cd38fd26551b1bb7cfdc953c3101f0))
* Enforce Functor ([72ba4e8](https://github.com/MikuroXina/mini-fn/commit/72ba4e88d90fbdea7daced0a162da1b661eae580))
* Enforce Lens ([#69](https://github.com/MikuroXina/mini-fn/issues/69)) ([5b81106](https://github.com/MikuroXina/mini-fn/commit/5b811068e2d99814cca12d44145ee3f55e9fb99c))
* Export all ([64c8d5d](https://github.com/MikuroXina/mini-fn/commit/64c8d5deb15824653fbdc8bb4e9978884717df26))
* Impl Eq and Ord for some data ([#28](https://github.com/MikuroXina/mini-fn/issues/28)) ([c6985b9](https://github.com/MikuroXina/mini-fn/commit/c6985b9a1684f1f1df725ca38da862d314a07935))
* Improve Free implementation ([#8](https://github.com/MikuroXina/mini-fn/issues/8)) ([daf1ddb](https://github.com/MikuroXina/mini-fn/commit/daf1ddb974d5c1b7d00b5951ee7955a77525a383))
* Improve Optical to be simpler ([#104](https://github.com/MikuroXina/mini-fn/issues/104)) ([5c7b1af](https://github.com/MikuroXina/mini-fn/commit/5c7b1afd894e4b4af30aa0689b7bf18f8c09b1a9))
* Improve Writer and Add test ([#22](https://github.com/MikuroXina/mini-fn/issues/22)) ([86023ce](https://github.com/MikuroXina/mini-fn/commit/86023ce71b8ac0a23bb3c4ffea66abada8158429))
* New higher kinded types system ([#46](https://github.com/MikuroXina/mini-fn/issues/46)) ([524b5c3](https://github.com/MikuroXina/mini-fn/commit/524b5c36a03c5f206809c710d4f1a4a9df02f58e))
* Remake Lens as Optical ([#95](https://github.com/MikuroXina/mini-fn/issues/95)) ([7d6a466](https://github.com/MikuroXina/mini-fn/commit/7d6a466dddc544cd0b45f2f918c38014b98f331d))
* Setup ([cb5b3a7](https://github.com/MikuroXina/mini-fn/commit/cb5b3a72ac0db62411dda4614ce87f8aff81352b))


### Bug Fixes

* Add docs and Improve filter func ([#105](https://github.com/MikuroXina/mini-fn/issues/105)) ([b8629d1](https://github.com/MikuroXina/mini-fn/commit/b8629d13211435d9b713897e3cc0c2bf315bda60))
* Add more docs and Fix incomplete typings ([#56](https://github.com/MikuroXina/mini-fn/issues/56)) ([b451909](https://github.com/MikuroXina/mini-fn/commit/b4519094f6fa47725b63cbd82cf8697c837838ee))
* Add writer for MonadWriter ([#58](https://github.com/MikuroXina/mini-fn/issues/58)) ([4e5f1a0](https://github.com/MikuroXina/mini-fn/commit/4e5f1a0fd66eff54a06553e1e86ee308d40de87a))
* Enforce Cat test ([#36](https://github.com/MikuroXina/mini-fn/issues/36)) ([fbfe2d9](https://github.com/MikuroXina/mini-fn/commit/fbfe2d9bf2f4b90825f686d09f1ec7cb002c028c))
* Fix calling mapOr ([52a07b0](https://github.com/MikuroXina/mini-fn/commit/52a07b0636ab6a9512f8483b33274e7eb5d9cb5d))
* Fix Contravariant ([d5991bf](https://github.com/MikuroXina/mini-fn/commit/d5991bfc1d805fa4eae276ad231e2397ad9d01d6))
* Fix exports in lib ([#81](https://github.com/MikuroXina/mini-fn/issues/81)) ([011fedd](https://github.com/MikuroXina/mini-fn/commit/011fedd03f9d2be836b638a7936e1f9273cc71a9))
* Fix exports of library ([#42](https://github.com/MikuroXina/mini-fn/issues/42)) ([b244a4e](https://github.com/MikuroXina/mini-fn/commit/b244a4ef1485a65ce73570861c3f59dd85061a41))
* Fix lacking exports ([#25](https://github.com/MikuroXina/mini-fn/issues/25)) ([4481d49](https://github.com/MikuroXina/mini-fn/commit/4481d495a31a742d4b23ad05a488c2de138de264))
* Fix lint errors ([61439dc](https://github.com/MikuroXina/mini-fn/commit/61439dc9b8c2419bbcf8a670090a0a5701a17b30))
* Fix order of type parameter ([3ece072](https://github.com/MikuroXina/mini-fn/commit/3ece0723f16ba3f2c810ca1e59bee1b5d42ee661))
* Fix package definition ([#33](https://github.com/MikuroXina/mini-fn/issues/33)) ([226f368](https://github.com/MikuroXina/mini-fn/commit/226f3683c9fe41585e6e3004c157019da7244933))
* Fix parameter order ([3bab4c5](https://github.com/MikuroXina/mini-fn/commit/3bab4c59f4ca26f22fd1ede6eac8022a3aebc440))
* Fix parameter order of Option ([c29817f](https://github.com/MikuroXina/mini-fn/commit/c29817fa91f181da3b5de0fd694d6fc192266fcf))
* Fix parameter order of Result ([16be281](https://github.com/MikuroXina/mini-fn/commit/16be281754964aa20f5445c70672c83382d43f61))
* Fix parameter order of State ([d268fd7](https://github.com/MikuroXina/mini-fn/commit/d268fd7a0c2347665e25124409269d537ffdf6cd))
* Fix parameter order of zipWith ([e2a1c60](https://github.com/MikuroXina/mini-fn/commit/e2a1c60fac77531d990f140087f9bfec8f1f6780))
* Fix to use void over unit ([#107](https://github.com/MikuroXina/mini-fn/issues/107)) ([f7efc73](https://github.com/MikuroXina/mini-fn/commit/f7efc735a2def9b519e134cca9f8454cf101ad28))
* Fix type instances for Tuple ([#26](https://github.com/MikuroXina/mini-fn/issues/26)) ([d73d1d2](https://github.com/MikuroXina/mini-fn/commit/d73d1d2b12cebe914dabdc548ef9c61bad7cfaac))
* Fix type of optResToResOpt ([bf754d2](https://github.com/MikuroXina/mini-fn/commit/bf754d2c450b387d4a02dee58efe7f710fa6afed))
* Fix typing in tests ([#67](https://github.com/MikuroXina/mini-fn/issues/67)) ([585873f](https://github.com/MikuroXina/mini-fn/commit/585873f26b0db7bff764129dd02e239f081c192f))
* Improve constructor return type ([1f752d1](https://github.com/MikuroXina/mini-fn/commit/1f752d117fc2bf05cf2b9a2b6c7da787d9577744))
* Improve Ordering ([a233162](https://github.com/MikuroXina/mini-fn/commit/a233162e6e17264489689e8ca167889ab7adac75))
* Improve Reader controls ([fc1dbae](https://github.com/MikuroXina/mini-fn/commit/fc1dbae70c23252ebf81a4d3859a9e62d9096353))
* Improve to be tree-shakable ([#14](https://github.com/MikuroXina/mini-fn/issues/14)) ([4470c7d](https://github.com/MikuroXina/mini-fn/commit/4470c7d9de49549712408e98bae456e93f011d05))
* Inline flatMap as andThen ([7083ffb](https://github.com/MikuroXina/mini-fn/commit/7083ffb0e7cdf0c17d53b8cb71fb815dba56f354))
* Make importsNotUsedAsValues error ([9073eee](https://github.com/MikuroXina/mini-fn/commit/9073eee9901296192c2abc53820399b1d799c5a3))
* Make types readonly ([#24](https://github.com/MikuroXina/mini-fn/issues/24)) ([b38ee42](https://github.com/MikuroXina/mini-fn/commit/b38ee427e7a8ed375ba4f390fbf0aeed9ba58415))
* Optimize imports ([38f9f24](https://github.com/MikuroXina/mini-fn/commit/38f9f246dee41d401e56b69d362727f9f9120b2c))
* Remove lib ([14e83d7](https://github.com/MikuroXina/mini-fn/commit/14e83d777d7ea3d76e5852a34c9e8d35fc241f3d))
* Remove needless extends ([#60](https://github.com/MikuroXina/mini-fn/issues/60)) ([82d85a2](https://github.com/MikuroXina/mini-fn/commit/82d85a21adefd875abd7d9a98ab6d2d7f30f75b0))
* Remove oneShot and Enforce test for func ([#40](https://github.com/MikuroXina/mini-fn/issues/40)) ([e9e4e19](https://github.com/MikuroXina/mini-fn/commit/e9e4e19b9b27fa3e45b337dfe22967dcabaf0559))
* Rename Double into Weak ([8132ccb](https://github.com/MikuroXina/mini-fn/commit/8132ccbd1a47faba8434d794fd11c11b1d17fb70))
* Tidy up about Ord and Eq ([#34](https://github.com/MikuroXina/mini-fn/issues/34)) ([4e5c496](https://github.com/MikuroXina/mini-fn/commit/4e5c4966ace85c240287f606133478d7662fd1ec))


### Miscellaneous Chores

* release 0.3.0 ([#10](https://github.com/MikuroXina/mini-fn/issues/10)) ([4b7daa0](https://github.com/MikuroXina/mini-fn/commit/4b7daa0d0431091b3bf0ff7dece1c0d6b6652540))
* Retry release ([#112](https://github.com/MikuroXina/mini-fn/issues/112)) ([0f523d8](https://github.com/MikuroXina/mini-fn/commit/0f523d8fab8a40deb623f68e56bb66ec67c8a23c))


### Tests

* Fix type for docs ([#113](https://github.com/MikuroXina/mini-fn/issues/113)) ([072cc7b](https://github.com/MikuroXina/mini-fn/commit/072cc7b8a4683caddd487e4741df49f2232e6366))

## [5.0.0](https://github.com/MikuroXina/mini-fn/compare/v5.0.0...v5.0.0) (2023-09-21)


### ⚠ BREAKING CHANGES

* Improve Optical to be simpler ([#104](https://github.com/MikuroXina/mini-fn/issues/104))
* Remake Lens as Optical ([#95](https://github.com/MikuroXina/mini-fn/issues/95))
* Enforce Lens ([#69](https://github.com/MikuroXina/mini-fn/issues/69))
* Add more docs and Fix incomplete typings ([#56](https://github.com/MikuroXina/mini-fn/issues/56))
* Add Adjunction and Remove Semigroupal from Apply ([#49](https://github.com/MikuroXina/mini-fn/issues/49))
* Add natural transformations and profunctors ([#48](https://github.com/MikuroXina/mini-fn/issues/48))
* New higher kinded types system ([#46](https://github.com/MikuroXina/mini-fn/issues/46))
* Remove oneShot and Enforce test for func ([#40](https://github.com/MikuroXina/mini-fn/issues/40))
* Tidy up about Ord and Eq ([#34](https://github.com/MikuroXina/mini-fn/issues/34))
* Make types readonly ([#24](https://github.com/MikuroXina/mini-fn/issues/24))
* Improve to be tree-shakable ([#14](https://github.com/MikuroXina/mini-fn/issues/14))
* Improve Free implementation ([#8](https://github.com/MikuroXina/mini-fn/issues/8))

### Features

* Add Adjunction and Remove Semigroupal from Apply ([#49](https://github.com/MikuroXina/mini-fn/issues/49)) ([368ed8f](https://github.com/MikuroXina/mini-fn/commit/368ed8f213bc3cddd86fde89ff97ce77532b7adb))
* Add adjunction for Free ([#51](https://github.com/MikuroXina/mini-fn/issues/51)) ([a8be37d](https://github.com/MikuroXina/mini-fn/commit/a8be37d3c0bdeb16141a064889bc3bf96f7b4a39))
* Add boolean monoid ([85cf720](https://github.com/MikuroXina/mini-fn/commit/85cf72065cb9a82008b28b81040a58d4819a73b4))
* Add cartesianProduct and related stuffs ([#27](https://github.com/MikuroXina/mini-fn/issues/27)) ([82dd09d](https://github.com/MikuroXina/mini-fn/commit/82dd09d51eaac154f8d223cc86436b3318bbcb8a))
* Add Cat ([c178a10](https://github.com/MikuroXina/mini-fn/commit/c178a1052c46a2c32453491d3ebd742c9f001f1d))
* Add CatT, monad chaining gadget ([#74](https://github.com/MikuroXina/mini-fn/issues/74)) ([2335008](https://github.com/MikuroXina/mini-fn/commit/2335008c06d699b2a63ac5b9f891e7773188cc70))
* Add Comonad, Zipper, Store ([#23](https://github.com/MikuroXina/mini-fn/issues/23)) ([7e70132](https://github.com/MikuroXina/mini-fn/commit/7e701327d7800e1f3baf6859370ec3abbd76c312))
* Add ComonadStore ([#57](https://github.com/MikuroXina/mini-fn/issues/57)) ([a6ba201](https://github.com/MikuroXina/mini-fn/commit/a6ba20108f35619e4333076c7dd6b57112a86bf1))
* Add Cont monad ([6a92dfc](https://github.com/MikuroXina/mini-fn/commit/6a92dfcf88e59560a5a32d81aa4f61ed1902ff5d))
* Add contains ([db692ca](https://github.com/MikuroXina/mini-fn/commit/db692caf158845dcbf6fdd3b8fd06b1ee6016618))
* Add Contravariant ([5c25aab](https://github.com/MikuroXina/mini-fn/commit/5c25aabcf47329743956c09e07aa98057d168f9a))
* Add curry ([2216b49](https://github.com/MikuroXina/mini-fn/commit/2216b499645e985fe9f6cc716d6b12aa81667332))
* Add debug, dirxml and table ([9b5ee45](https://github.com/MikuroXina/mini-fn/commit/9b5ee45b8115ec66030847788f5f935213aca8c8))
* Add Endo ([3571d83](https://github.com/MikuroXina/mini-fn/commit/3571d83370ef9c0592a22ff0c6772f154770e473))
* Add Foldable ([1acae6e](https://github.com/MikuroXina/mini-fn/commit/1acae6efbed9e470392d03dca80ae20494c825ff))
* Add Free monad ([9c8fc8b](https://github.com/MikuroXina/mini-fn/commit/9c8fc8bac8b6e312c86737d8a1dca84383559201))
* Add func ([6d4ab72](https://github.com/MikuroXina/mini-fn/commit/6d4ab72c866e2b9152066f49c8af2c8b33b8f836))
* Add Functor ([45c12de](https://github.com/MikuroXina/mini-fn/commit/45c12de9b90c4f3bc81b125a8366a9e4aa9c6db2))
* Add Group and something ([#63](https://github.com/MikuroXina/mini-fn/issues/63)) ([6ca2b70](https://github.com/MikuroXina/mini-fn/commit/6ca2b70ba8114460ce5857cee9363c0f453f0ef2))
* Add Identity ([ce0a2a7](https://github.com/MikuroXina/mini-fn/commit/ce0a2a7190633e895d17522ab40632da7dc0582e))
* Add lib ([8b326a8](https://github.com/MikuroXina/mini-fn/commit/8b326a844eb431ab4d7c975921acbf39437cd681))
* Add List monad ([2bdd61a](https://github.com/MikuroXina/mini-fn/commit/2bdd61adb529699fd522dd5bcb0e0705dacecc58))
* Add local ([c67f0e4](https://github.com/MikuroXina/mini-fn/commit/c67f0e4156d5e9926053fa80f77765260fae878b))
* Add makeMonoid ([6a783cb](https://github.com/MikuroXina/mini-fn/commit/6a783cbadc58d6a96bb48086a0b975059ef7838a))
* Add monad ([21ea1e2](https://github.com/MikuroXina/mini-fn/commit/21ea1e26982a739119bbe75b50248968717f3792))
* Add monoid ([8e94831](https://github.com/MikuroXina/mini-fn/commit/8e94831db66e36f4d24b827c544e27a76833f80b))
* Add monoid and monad for Promise ([e1cde54](https://github.com/MikuroXina/mini-fn/commit/e1cde5483b26c78f11a8ce2d7ef2d213570441e1))
* Add monoidal categories ([#52](https://github.com/MikuroXina/mini-fn/issues/52)) ([5f927fb](https://github.com/MikuroXina/mini-fn/commit/5f927fb64942cee390f6590863262cbb95e6908a))
* Add natural transformations and profunctors ([#48](https://github.com/MikuroXina/mini-fn/issues/48)) ([cfc1652](https://github.com/MikuroXina/mini-fn/commit/cfc1652339bbe26553cfae6bb24a4c4c6299bd08))
* Add okOr and okOrElse ([2d3531a](https://github.com/MikuroXina/mini-fn/commit/2d3531aba65bf9816c698b9c6722cd9f1bd36364))
* Add PartialEq and Eq ([4cab899](https://github.com/MikuroXina/mini-fn/commit/4cab899c64d06271321970db9ff0d3f91ea0d220))
* Add partialEq and eq for Option and List ([#20](https://github.com/MikuroXina/mini-fn/issues/20)) ([e823418](https://github.com/MikuroXina/mini-fn/commit/e823418ba9b8a009073e5ad16e568d7bd1cd3400))
* Add PartialOrd, Ord and Option ([57f6a1e](https://github.com/MikuroXina/mini-fn/commit/57f6a1e053c923384fc2e8db60d09b34bc6fbfca))
* Add Profunctor and Strong ([7d1abae](https://github.com/MikuroXina/mini-fn/commit/7d1abae3f1829959ff972faf6f8a2d54a0ccb4f6))
* Add Reader monad ([42bd1ab](https://github.com/MikuroXina/mini-fn/commit/42bd1abeb3a03d787b0021930260451266f086ea))
* Add Result and Integrate with Option ([08f0e0f](https://github.com/MikuroXina/mini-fn/commit/08f0e0f36e8faf78938001c0c0a0dd6320f942c2))
* Add Reverse ([#66](https://github.com/MikuroXina/mini-fn/issues/66)) ([74b68b9](https://github.com/MikuroXina/mini-fn/commit/74b68b92f04504efa9509a12e00896dbfd85a8bf))
* Add SemiGroupoid and Category ([966feee](https://github.com/MikuroXina/mini-fn/commit/966feee5e15410c8c361404ab1e4732d8e45debf))
* Add Seq and FingerTree ([#50](https://github.com/MikuroXina/mini-fn/issues/50)) ([2908578](https://github.com/MikuroXina/mini-fn/commit/29085786e2ce44029d6c98d39e2436cd95826b6e))
* Add some partial-applied and Enforce test ([#37](https://github.com/MikuroXina/mini-fn/issues/37)) ([c76c35e](https://github.com/MikuroXina/mini-fn/commit/c76c35ec832b1cbe88f2eed886b13665c20df26a))
* Add State monad ([48baf79](https://github.com/MikuroXina/mini-fn/commit/48baf793dc1071b6cc640fa758508cd8629cc54c))
* Add test and features and Fix bugs for List ([#19](https://github.com/MikuroXina/mini-fn/issues/19)) ([292555f](https://github.com/MikuroXina/mini-fn/commit/292555fe313efd334b6f2803e078e5d4a25af484))
* Add then for CatT ([#106](https://github.com/MikuroXina/mini-fn/issues/106)) ([9d2fb36](https://github.com/MikuroXina/mini-fn/commit/9d2fb3601b73f36d8c8a2d4ef20f1dc80294edd6))
* Add Traversable ([5b2f540](https://github.com/MikuroXina/mini-fn/commit/5b2f5406816dd3207e53878790d2a01c0783ee69))
* Add tuple ([515aaed](https://github.com/MikuroXina/mini-fn/commit/515aaede682223fb1323b90342796ddbb8e09352))
* Add variance annotations ([24b32df](https://github.com/MikuroXina/mini-fn/commit/24b32dfda5f96df4399da25fec263ac59648d312))
* Add Writer monad ([cb35d66](https://github.com/MikuroXina/mini-fn/commit/cb35d6651e97594aaf37fc7caeb5ddf5e6a1e5c2))
* Enforce Apply ([1a0fd11](https://github.com/MikuroXina/mini-fn/commit/1a0fd11202cd38fd26551b1bb7cfdc953c3101f0))
* Enforce Functor ([72ba4e8](https://github.com/MikuroXina/mini-fn/commit/72ba4e88d90fbdea7daced0a162da1b661eae580))
* Enforce Lens ([#69](https://github.com/MikuroXina/mini-fn/issues/69)) ([5b81106](https://github.com/MikuroXina/mini-fn/commit/5b811068e2d99814cca12d44145ee3f55e9fb99c))
* Export all ([64c8d5d](https://github.com/MikuroXina/mini-fn/commit/64c8d5deb15824653fbdc8bb4e9978884717df26))
* Impl Eq and Ord for some data ([#28](https://github.com/MikuroXina/mini-fn/issues/28)) ([c6985b9](https://github.com/MikuroXina/mini-fn/commit/c6985b9a1684f1f1df725ca38da862d314a07935))
* Improve Free implementation ([#8](https://github.com/MikuroXina/mini-fn/issues/8)) ([daf1ddb](https://github.com/MikuroXina/mini-fn/commit/daf1ddb974d5c1b7d00b5951ee7955a77525a383))
* Improve Optical to be simpler ([#104](https://github.com/MikuroXina/mini-fn/issues/104)) ([5c7b1af](https://github.com/MikuroXina/mini-fn/commit/5c7b1afd894e4b4af30aa0689b7bf18f8c09b1a9))
* Improve Writer and Add test ([#22](https://github.com/MikuroXina/mini-fn/issues/22)) ([86023ce](https://github.com/MikuroXina/mini-fn/commit/86023ce71b8ac0a23bb3c4ffea66abada8158429))
* New higher kinded types system ([#46](https://github.com/MikuroXina/mini-fn/issues/46)) ([524b5c3](https://github.com/MikuroXina/mini-fn/commit/524b5c36a03c5f206809c710d4f1a4a9df02f58e))
* Remake Lens as Optical ([#95](https://github.com/MikuroXina/mini-fn/issues/95)) ([7d6a466](https://github.com/MikuroXina/mini-fn/commit/7d6a466dddc544cd0b45f2f918c38014b98f331d))
* Setup ([cb5b3a7](https://github.com/MikuroXina/mini-fn/commit/cb5b3a72ac0db62411dda4614ce87f8aff81352b))


### Bug Fixes

* Add docs and Improve filter func ([#105](https://github.com/MikuroXina/mini-fn/issues/105)) ([b8629d1](https://github.com/MikuroXina/mini-fn/commit/b8629d13211435d9b713897e3cc0c2bf315bda60))
* Add more docs and Fix incomplete typings ([#56](https://github.com/MikuroXina/mini-fn/issues/56)) ([b451909](https://github.com/MikuroXina/mini-fn/commit/b4519094f6fa47725b63cbd82cf8697c837838ee))
* Add writer for MonadWriter ([#58](https://github.com/MikuroXina/mini-fn/issues/58)) ([4e5f1a0](https://github.com/MikuroXina/mini-fn/commit/4e5f1a0fd66eff54a06553e1e86ee308d40de87a))
* Enforce Cat test ([#36](https://github.com/MikuroXina/mini-fn/issues/36)) ([fbfe2d9](https://github.com/MikuroXina/mini-fn/commit/fbfe2d9bf2f4b90825f686d09f1ec7cb002c028c))
* Fix calling mapOr ([52a07b0](https://github.com/MikuroXina/mini-fn/commit/52a07b0636ab6a9512f8483b33274e7eb5d9cb5d))
* Fix Contravariant ([d5991bf](https://github.com/MikuroXina/mini-fn/commit/d5991bfc1d805fa4eae276ad231e2397ad9d01d6))
* Fix exports in lib ([#81](https://github.com/MikuroXina/mini-fn/issues/81)) ([011fedd](https://github.com/MikuroXina/mini-fn/commit/011fedd03f9d2be836b638a7936e1f9273cc71a9))
* Fix exports of library ([#42](https://github.com/MikuroXina/mini-fn/issues/42)) ([b244a4e](https://github.com/MikuroXina/mini-fn/commit/b244a4ef1485a65ce73570861c3f59dd85061a41))
* Fix lacking exports ([#25](https://github.com/MikuroXina/mini-fn/issues/25)) ([4481d49](https://github.com/MikuroXina/mini-fn/commit/4481d495a31a742d4b23ad05a488c2de138de264))
* Fix lint errors ([61439dc](https://github.com/MikuroXina/mini-fn/commit/61439dc9b8c2419bbcf8a670090a0a5701a17b30))
* Fix order of type parameter ([3ece072](https://github.com/MikuroXina/mini-fn/commit/3ece0723f16ba3f2c810ca1e59bee1b5d42ee661))
* Fix package definition ([#33](https://github.com/MikuroXina/mini-fn/issues/33)) ([226f368](https://github.com/MikuroXina/mini-fn/commit/226f3683c9fe41585e6e3004c157019da7244933))
* Fix parameter order ([3bab4c5](https://github.com/MikuroXina/mini-fn/commit/3bab4c59f4ca26f22fd1ede6eac8022a3aebc440))
* Fix parameter order of Option ([c29817f](https://github.com/MikuroXina/mini-fn/commit/c29817fa91f181da3b5de0fd694d6fc192266fcf))
* Fix parameter order of Result ([16be281](https://github.com/MikuroXina/mini-fn/commit/16be281754964aa20f5445c70672c83382d43f61))
* Fix parameter order of State ([d268fd7](https://github.com/MikuroXina/mini-fn/commit/d268fd7a0c2347665e25124409269d537ffdf6cd))
* Fix parameter order of zipWith ([e2a1c60](https://github.com/MikuroXina/mini-fn/commit/e2a1c60fac77531d990f140087f9bfec8f1f6780))
* Fix to use void over unit ([#107](https://github.com/MikuroXina/mini-fn/issues/107)) ([f7efc73](https://github.com/MikuroXina/mini-fn/commit/f7efc735a2def9b519e134cca9f8454cf101ad28))
* Fix type instances for Tuple ([#26](https://github.com/MikuroXina/mini-fn/issues/26)) ([d73d1d2](https://github.com/MikuroXina/mini-fn/commit/d73d1d2b12cebe914dabdc548ef9c61bad7cfaac))
* Fix type of optResToResOpt ([bf754d2](https://github.com/MikuroXina/mini-fn/commit/bf754d2c450b387d4a02dee58efe7f710fa6afed))
* Fix typing in tests ([#67](https://github.com/MikuroXina/mini-fn/issues/67)) ([585873f](https://github.com/MikuroXina/mini-fn/commit/585873f26b0db7bff764129dd02e239f081c192f))
* Improve constructor return type ([1f752d1](https://github.com/MikuroXina/mini-fn/commit/1f752d117fc2bf05cf2b9a2b6c7da787d9577744))
* Improve Ordering ([a233162](https://github.com/MikuroXina/mini-fn/commit/a233162e6e17264489689e8ca167889ab7adac75))
* Improve Reader controls ([fc1dbae](https://github.com/MikuroXina/mini-fn/commit/fc1dbae70c23252ebf81a4d3859a9e62d9096353))
* Improve to be tree-shakable ([#14](https://github.com/MikuroXina/mini-fn/issues/14)) ([4470c7d](https://github.com/MikuroXina/mini-fn/commit/4470c7d9de49549712408e98bae456e93f011d05))
* Inline flatMap as andThen ([7083ffb](https://github.com/MikuroXina/mini-fn/commit/7083ffb0e7cdf0c17d53b8cb71fb815dba56f354))
* Make importsNotUsedAsValues error ([9073eee](https://github.com/MikuroXina/mini-fn/commit/9073eee9901296192c2abc53820399b1d799c5a3))
* Make types readonly ([#24](https://github.com/MikuroXina/mini-fn/issues/24)) ([b38ee42](https://github.com/MikuroXina/mini-fn/commit/b38ee427e7a8ed375ba4f390fbf0aeed9ba58415))
* Optimize imports ([38f9f24](https://github.com/MikuroXina/mini-fn/commit/38f9f246dee41d401e56b69d362727f9f9120b2c))
* Remove lib ([14e83d7](https://github.com/MikuroXina/mini-fn/commit/14e83d777d7ea3d76e5852a34c9e8d35fc241f3d))
* Remove needless extends ([#60](https://github.com/MikuroXina/mini-fn/issues/60)) ([82d85a2](https://github.com/MikuroXina/mini-fn/commit/82d85a21adefd875abd7d9a98ab6d2d7f30f75b0))
* Remove oneShot and Enforce test for func ([#40](https://github.com/MikuroXina/mini-fn/issues/40)) ([e9e4e19](https://github.com/MikuroXina/mini-fn/commit/e9e4e19b9b27fa3e45b337dfe22967dcabaf0559))
* Rename Double into Weak ([8132ccb](https://github.com/MikuroXina/mini-fn/commit/8132ccbd1a47faba8434d794fd11c11b1d17fb70))
* Tidy up about Ord and Eq ([#34](https://github.com/MikuroXina/mini-fn/issues/34)) ([4e5c496](https://github.com/MikuroXina/mini-fn/commit/4e5c4966ace85c240287f606133478d7662fd1ec))


### Miscellaneous Chores

* release 0.3.0 ([#10](https://github.com/MikuroXina/mini-fn/issues/10)) ([4b7daa0](https://github.com/MikuroXina/mini-fn/commit/4b7daa0d0431091b3bf0ff7dece1c0d6b6652540))
* Retry release ([#112](https://github.com/MikuroXina/mini-fn/issues/112)) ([0f523d8](https://github.com/MikuroXina/mini-fn/commit/0f523d8fab8a40deb623f68e56bb66ec67c8a23c))

## [5.0.0](https://github.com/MikuroXina/mini-fn/compare/v4.1.1...v5.0.0) (2023-09-20)


### ⚠ BREAKING CHANGES

* Improve Optical to be simpler ([#104](https://github.com/MikuroXina/mini-fn/issues/104))
* Remake Lens as Optical ([#95](https://github.com/MikuroXina/mini-fn/issues/95))

### Features

* Add then for CatT ([#106](https://github.com/MikuroXina/mini-fn/issues/106)) ([9d2fb36](https://github.com/MikuroXina/mini-fn/commit/9d2fb3601b73f36d8c8a2d4ef20f1dc80294edd6))
* Improve Optical to be simpler ([#104](https://github.com/MikuroXina/mini-fn/issues/104)) ([5c7b1af](https://github.com/MikuroXina/mini-fn/commit/5c7b1afd894e4b4af30aa0689b7bf18f8c09b1a9))
* Remake Lens as Optical ([#95](https://github.com/MikuroXina/mini-fn/issues/95)) ([7d6a466](https://github.com/MikuroXina/mini-fn/commit/7d6a466dddc544cd0b45f2f918c38014b98f331d))


### Bug Fixes

* Add docs and Improve filter func ([#105](https://github.com/MikuroXina/mini-fn/issues/105)) ([b8629d1](https://github.com/MikuroXina/mini-fn/commit/b8629d13211435d9b713897e3cc0c2bf315bda60))

## [4.1.1](https://github.com/MikuroXina/mini-fn/compare/v4.1.0...v4.1.1) (2023-08-16)


### Bug Fixes

* Fix exports in lib ([#81](https://github.com/MikuroXina/mini-fn/issues/81)) ([011fedd](https://github.com/MikuroXina/mini-fn/commit/011fedd03f9d2be836b638a7936e1f9273cc71a9))

## [4.1.0](https://github.com/MikuroXina/mini-fn/compare/v4.0.0...v4.1.0) (2023-08-13)


### Features

* Add CatT, monad chaining gadget ([#74](https://github.com/MikuroXina/mini-fn/issues/74)) ([2335008](https://github.com/MikuroXina/mini-fn/commit/2335008c06d699b2a63ac5b9f891e7773188cc70))

## [4.0.0](https://github.com/MikuroXina/mini-fn/compare/v3.1.1...v4.0.0) (2023-07-23)


### ⚠ BREAKING CHANGES

* Enforce Lens ([#69](https://github.com/MikuroXina/mini-fn/issues/69))

### Features

* Enforce Lens ([#69](https://github.com/MikuroXina/mini-fn/issues/69)) ([5b81106](https://github.com/MikuroXina/mini-fn/commit/5b811068e2d99814cca12d44145ee3f55e9fb99c))

## [3.1.1](https://github.com/MikuroXina/mini-fn/compare/v3.1.0...v3.1.1) (2023-06-11)


### Bug Fixes

* Fix typing in tests ([#67](https://github.com/MikuroXina/mini-fn/issues/67)) ([585873f](https://github.com/MikuroXina/mini-fn/commit/585873f26b0db7bff764129dd02e239f081c192f))

## [3.1.0](https://github.com/MikuroXina/mini-fn/compare/v3.0.1...v3.1.0) (2023-06-10)


### Features

* Add Group and something ([#63](https://github.com/MikuroXina/mini-fn/issues/63)) ([6ca2b70](https://github.com/MikuroXina/mini-fn/commit/6ca2b70ba8114460ce5857cee9363c0f453f0ef2))
* Add Reverse ([#66](https://github.com/MikuroXina/mini-fn/issues/66)) ([74b68b9](https://github.com/MikuroXina/mini-fn/commit/74b68b92f04504efa9509a12e00896dbfd85a8bf))

## [3.0.1](https://github.com/MikuroXina/mini-fn/compare/v3.0.0...v3.0.1) (2023-03-08)


### Bug Fixes

* Remove needless extends ([#60](https://github.com/MikuroXina/mini-fn/issues/60)) ([82d85a2](https://github.com/MikuroXina/mini-fn/commit/82d85a21adefd875abd7d9a98ab6d2d7f30f75b0))

## [3.0.0](https://github.com/MikuroXina/mini-fn/compare/v2.0.0...v3.0.0) (2023-03-08)


### ⚠ BREAKING CHANGES

* Add more docs and Fix incomplete typings ([#56](https://github.com/MikuroXina/mini-fn/issues/56))

### Features

* Add ComonadStore ([#57](https://github.com/MikuroXina/mini-fn/issues/57)) ([a6ba201](https://github.com/MikuroXina/mini-fn/commit/a6ba20108f35619e4333076c7dd6b57112a86bf1))
* Add monoidal categories ([#52](https://github.com/MikuroXina/mini-fn/issues/52)) ([5f927fb](https://github.com/MikuroXina/mini-fn/commit/5f927fb64942cee390f6590863262cbb95e6908a))


### Bug Fixes

* Add more docs and Fix incomplete typings ([#56](https://github.com/MikuroXina/mini-fn/issues/56)) ([b451909](https://github.com/MikuroXina/mini-fn/commit/b4519094f6fa47725b63cbd82cf8697c837838ee))
* Add writer for MonadWriter ([#58](https://github.com/MikuroXina/mini-fn/issues/58)) ([4e5f1a0](https://github.com/MikuroXina/mini-fn/commit/4e5f1a0fd66eff54a06553e1e86ee308d40de87a))

## [2.0.0](https://github.com/MikuroXina/mini-fn/compare/v1.0.0...v2.0.0) (2023-01-29)


### ⚠ BREAKING CHANGES

* Add Adjunction and Remove Semigroupal from Apply ([#49](https://github.com/MikuroXina/mini-fn/issues/49))
* Add natural transformations and profunctors ([#48](https://github.com/MikuroXina/mini-fn/issues/48))
* New higher kinded types system ([#46](https://github.com/MikuroXina/mini-fn/issues/46))

### Features

* Add Adjunction and Remove Semigroupal from Apply ([#49](https://github.com/MikuroXina/mini-fn/issues/49)) ([368ed8f](https://github.com/MikuroXina/mini-fn/commit/368ed8f213bc3cddd86fde89ff97ce77532b7adb))
* Add adjunction for Free ([#51](https://github.com/MikuroXina/mini-fn/issues/51)) ([a8be37d](https://github.com/MikuroXina/mini-fn/commit/a8be37d3c0bdeb16141a064889bc3bf96f7b4a39))
* Add natural transformations and profunctors ([#48](https://github.com/MikuroXina/mini-fn/issues/48)) ([cfc1652](https://github.com/MikuroXina/mini-fn/commit/cfc1652339bbe26553cfae6bb24a4c4c6299bd08))
* Add Seq and FingerTree ([#50](https://github.com/MikuroXina/mini-fn/issues/50)) ([2908578](https://github.com/MikuroXina/mini-fn/commit/29085786e2ce44029d6c98d39e2436cd95826b6e))
* New higher kinded types system ([#46](https://github.com/MikuroXina/mini-fn/issues/46)) ([524b5c3](https://github.com/MikuroXina/mini-fn/commit/524b5c36a03c5f206809c710d4f1a4a9df02f58e))

## [1.0.0](https://github.com/MikuroXina/mini-fn/compare/v0.3.0...v1.0.0) (2022-12-25)


### ⚠ BREAKING CHANGES

* Remove oneShot and Enforce test for func ([#40](https://github.com/MikuroXina/mini-fn/issues/40))
* Tidy up about Ord and Eq ([#34](https://github.com/MikuroXina/mini-fn/issues/34))
* Make types readonly ([#24](https://github.com/MikuroXina/mini-fn/issues/24))
* Improve to be tree-shakable ([#14](https://github.com/MikuroXina/mini-fn/issues/14))

### Features

* Add cartesianProduct and related stuffs ([#27](https://github.com/MikuroXina/mini-fn/issues/27)) ([82dd09d](https://github.com/MikuroXina/mini-fn/commit/82dd09d51eaac154f8d223cc86436b3318bbcb8a))
* Add Comonad, Zipper, Store ([#23](https://github.com/MikuroXina/mini-fn/issues/23)) ([7e70132](https://github.com/MikuroXina/mini-fn/commit/7e701327d7800e1f3baf6859370ec3abbd76c312))
* Add partialEq and eq for Option and List ([#20](https://github.com/MikuroXina/mini-fn/issues/20)) ([e823418](https://github.com/MikuroXina/mini-fn/commit/e823418ba9b8a009073e5ad16e568d7bd1cd3400))
* Add some partial-applied and Enforce test ([#37](https://github.com/MikuroXina/mini-fn/issues/37)) ([c76c35e](https://github.com/MikuroXina/mini-fn/commit/c76c35ec832b1cbe88f2eed886b13665c20df26a))
* Add test and features and Fix bugs for List ([#19](https://github.com/MikuroXina/mini-fn/issues/19)) ([292555f](https://github.com/MikuroXina/mini-fn/commit/292555fe313efd334b6f2803e078e5d4a25af484))
* Impl Eq and Ord for some data ([#28](https://github.com/MikuroXina/mini-fn/issues/28)) ([c6985b9](https://github.com/MikuroXina/mini-fn/commit/c6985b9a1684f1f1df725ca38da862d314a07935))
* Improve Writer and Add test ([#22](https://github.com/MikuroXina/mini-fn/issues/22)) ([86023ce](https://github.com/MikuroXina/mini-fn/commit/86023ce71b8ac0a23bb3c4ffea66abada8158429))


### Bug Fixes

* Enforce Cat test ([#36](https://github.com/MikuroXina/mini-fn/issues/36)) ([fbfe2d9](https://github.com/MikuroXina/mini-fn/commit/fbfe2d9bf2f4b90825f686d09f1ec7cb002c028c))
* Fix exports of library ([#42](https://github.com/MikuroXina/mini-fn/issues/42)) ([b244a4e](https://github.com/MikuroXina/mini-fn/commit/b244a4ef1485a65ce73570861c3f59dd85061a41))
* Fix lacking exports ([#25](https://github.com/MikuroXina/mini-fn/issues/25)) ([4481d49](https://github.com/MikuroXina/mini-fn/commit/4481d495a31a742d4b23ad05a488c2de138de264))
* Fix package definition ([#33](https://github.com/MikuroXina/mini-fn/issues/33)) ([226f368](https://github.com/MikuroXina/mini-fn/commit/226f3683c9fe41585e6e3004c157019da7244933))
* Fix type instances for Tuple ([#26](https://github.com/MikuroXina/mini-fn/issues/26)) ([d73d1d2](https://github.com/MikuroXina/mini-fn/commit/d73d1d2b12cebe914dabdc548ef9c61bad7cfaac))
* Improve to be tree-shakable ([#14](https://github.com/MikuroXina/mini-fn/issues/14)) ([4470c7d](https://github.com/MikuroXina/mini-fn/commit/4470c7d9de49549712408e98bae456e93f011d05))
* Make types readonly ([#24](https://github.com/MikuroXina/mini-fn/issues/24)) ([b38ee42](https://github.com/MikuroXina/mini-fn/commit/b38ee427e7a8ed375ba4f390fbf0aeed9ba58415))
* Remove oneShot and Enforce test for func ([#40](https://github.com/MikuroXina/mini-fn/issues/40)) ([e9e4e19](https://github.com/MikuroXina/mini-fn/commit/e9e4e19b9b27fa3e45b337dfe22967dcabaf0559))
* Tidy up about Ord and Eq ([#34](https://github.com/MikuroXina/mini-fn/issues/34)) ([4e5c496](https://github.com/MikuroXina/mini-fn/commit/4e5c4966ace85c240287f606133478d7662fd1ec))

## [0.3.0](https://github.com/MikuroXina/mini-fn/compare/v0.2.0...v0.3.0) (2022-11-28)


### ⚠ BREAKING CHANGES

* Improve Free implementation ([#8](https://github.com/MikuroXina/mini-fn/issues/8))

### Features

* Improve Free implementation ([#8](https://github.com/MikuroXina/mini-fn/issues/8)) ([daf1ddb](https://github.com/MikuroXina/mini-fn/commit/daf1ddb974d5c1b7d00b5951ee7955a77525a383))


### Miscellaneous Chores

* release 0.3.0 ([#10](https://github.com/MikuroXina/mini-fn/issues/10)) ([4b7daa0](https://github.com/MikuroXina/mini-fn/commit/4b7daa0d0431091b3bf0ff7dece1c0d6b6652540))
